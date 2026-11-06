import { createHash, randomUUID } from "node:crypto";
import type {
  AnalyzeOptions,
  AnalyzeResult,
  RecallParams,
  RecallResult,
  RememberAcceptedResult,
  RememberBulkOptions,
  RememberBulkResult,
  RememberOptions,
  RememberResult,
} from "@mysten-incubation/memwal";
import type { FactKind, MemoryService, ProfileFact, RecalledFact, Suggestion } from "../types";
import {
  buildSuggestions,
  classifyText,
  dedupeRecalled,
  deriveHabit,
  formatFactText,
  bodyOf,
  normKey,
  type ObservedPayment,
} from "./learning";
import { POINTS, PointLimiter, withTimeout } from "./limiter";
import { JsonStore } from "./store";

/** The subset of MemWal we use. Lets tests inject a mock. */
export interface MemWalLike {
  rememberAsync(text: string, options?: RememberOptions): Promise<RememberAcceptedResult>;
  waitForRememberJob(jobId: string, opts?: { pollIntervalMs?: number; timeoutMs?: number }): Promise<RememberResult>;
  waitForRememberJobs(jobIds: string[], namespaces?: string[], opts?: RememberBulkOptions): Promise<RememberBulkResult>;
  recall(params: RecallParams): Promise<RecallResult>;
  analyze(text: string, options?: AnalyzeOptions): Promise<AnalyzeResult>;
}

export interface MemoryOptions {
  recallTimeoutMs?: number; // default 8000
  requestTimeoutMs?: number; // default 20000 (accepting a write / analyze)
  writeTimeoutMs?: number; // default 120000 (Walrus write ~30 s)
  pollIntervalMs?: number;
  defaultMaxDistance?: number; // default 0.5
  limiter?: PointLimiter;
  store?: JsonStore;
  now?: () => Date;
}

export interface RecallDetail {
  facts: RecalledFact[];
  stale: boolean; // true when served from cache because the live recall failed/timed out
  error?: string;
}

export class XeniaMemory implements MemoryService {
  private o: Required<Omit<MemoryOptions, "limiter" | "store">>;
  private limiter: PointLimiter;
  private store: JsonStore;
  private pending = new Set<Promise<unknown>>();

  constructor(private mem: MemWalLike, opts: MemoryOptions = {}) {
    this.o = {
      recallTimeoutMs: opts.recallTimeoutMs ?? 8_000,
      requestTimeoutMs: opts.requestTimeoutMs ?? 20_000,
      writeTimeoutMs: opts.writeTimeoutMs ?? 120_000,
      pollIntervalMs: opts.pollIntervalMs ?? 1_500,
      defaultMaxDistance: opts.defaultMaxDistance ?? 0.5,
      now: opts.now ?? (() => new Date()),
    };
    this.limiter = opts.limiter ?? new PointLimiter();
    this.store = opts.store ?? new JsonStore();
  }

  /** Resolves when all background writes have settled (tests, scripts). */
  async idle(): Promise<void> {
    while (this.pending.size) await Promise.allSettled([...this.pending]);
  }

  private background(p: Promise<unknown>): void {
    const t = p.catch(() => undefined).finally(() => this.pending.delete(t));
    this.pending.add(t);
  }

  /** After a restart: resume facts that had a job id, fail the rest. Call once at startup. */
  resumePending(): void {
    for (const f of this.store.data.facts) {
      if (f.status !== "saving") continue;
      if (f.jobId) this.background(this.waitJob(f));
      else this.finish(f, { error: "interrupted by server restart before the relayer accepted the write" });
    }
  }

  private finish(f: ProfileFact, r: { blobId?: string; error?: string }): void {
    if (r.blobId) {
      f.status = "saved";
      f.blobId = r.blobId;
      delete f.error;
    } else {
      f.status = "failed";
      f.error = r.error ?? "unknown error";
    }
    this.store.save();
  }

  private async waitJob(f: ProfileFact): Promise<void> {
    try {
      const res = await withTimeout(
        this.mem.waitForRememberJob(f.jobId!, { timeoutMs: this.o.writeTimeoutMs, pollIntervalMs: this.o.pollIntervalMs }),
        this.o.writeTimeoutMs + 5_000,
        "remember job",
      );
      this.finish(f, { blobId: res.blob_id });
    } catch (e) {
      this.finish(f, { error: (e as Error).message });
    }
  }

  // ---- writes ---------------------------------------------------------

  async saveFact(text: string, kind: FactKind): Promise<ProfileFact> {
    const full = formatFactText(text, kind, this.o.now());
    const existing = this.store.data.facts.find((f) => f.text === full && f.status !== "failed");
    if (existing) return { ...existing }; // idempotent: same text is never written twice

    const fact: ProfileFact = {
      localId: randomUUID(),
      text: full,
      kind,
      createdAt: this.o.now().toISOString(),
      status: "saving",
    };
    this.store.data.facts.unshift(fact);
    this.store.save();
    this.background(this.write(fact));
    return { ...fact };
  }

  private async write(f: ProfileFact): Promise<void> {
    // Same text => same key, so a retry can never create a duplicate blob.
    const idempotencyKey = `xenia-${createHash("sha256").update(f.text).digest("hex").slice(0, 40)}`;
    let lastErr = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await this.limiter.acquire(POINTS.remember);
        if (!f.jobId) {
          const acc = await withTimeout(
            this.mem.rememberAsync(f.text, { idempotencyKey }),
            this.o.requestTimeoutMs,
            "remember request",
          );
          f.jobId = acc.job_id;
          this.store.save();
        }
        const res = await withTimeout(
          this.mem.waitForRememberJob(f.jobId, { timeoutMs: this.o.writeTimeoutMs, pollIntervalMs: this.o.pollIntervalMs }),
          this.o.writeTimeoutMs + 5_000,
          "remember job",
        );
        this.finish(f, { blobId: res.blob_id });
        return;
      } catch (e) {
        lastErr = (e as Error).message;
      }
    }
    this.finish(f, { error: lastErr });
  }

  async learnFromText(freeText: string): Promise<ProfileFact[]> {
    await this.limiter.acquire(POINTS.analyze);
    const res = await withTimeout(
      this.mem.analyze(freeText, { occurredAt: this.o.now() }),
      this.o.requestTimeoutMs * 3,
      "analyze",
    );
    const out: ProfileFact[] = [];
    const jobByFact = new Map<string, ProfileFact>();
    for (const af of res.facts ?? []) {
      const jobId = af.job_id ?? af.id;
      const dup = this.store.data.facts.find((f) => f.text === af.text && f.status !== "failed");
      if (dup) {
        out.push({ ...dup });
        continue;
      }
      const fact: ProfileFact = {
        localId: randomUUID(),
        text: af.text,
        kind: classifyText(af.text),
        createdAt: this.o.now().toISOString(),
        status: af.blob_id ? "saved" : "saving",
        jobId,
        blobId: af.blob_id,
      };
      this.store.data.facts.unshift(fact);
      out.push(fact);
      if (!af.blob_id) jobByFact.set(jobId, fact);
    }
    this.store.save();
    if (jobByFact.size) this.background(this.waitAnalyzed(jobByFact));
    return out.map((f) => ({ ...f }));
  }

  private async waitAnalyzed(jobs: Map<string, ProfileFact>): Promise<void> {
    try {
      const res = await withTimeout(
        this.mem.waitForRememberJobs([...jobs.keys()], undefined, {
          timeoutMs: this.o.writeTimeoutMs,
          pollIntervalMs: this.o.pollIntervalMs,
        }),
        this.o.writeTimeoutMs + 5_000,
        "analyze jobs",
      );
      for (const r of res.results) {
        const f = jobs.get(r.id);
        if (!f) continue;
        this.finish(f, r.status === "done" && r.blob_id ? { blobId: r.blob_id } : { error: r.error ?? r.status });
      }
    } catch (e) {
      for (const f of jobs.values()) if (f.status === "saving") this.finish(f, { error: (e as Error).message });
    }
  }

  /**
   * Record a payment_habit fact from observed payments (needs >= 3). Returns null when there is
   * too little data or the same habit is already stored.
   */
  async observePayments(payments: ObservedPayment[]): Promise<ProfileFact | null> {
    const h = deriveHabit(payments);
    if (!h) return null;
    const key = normKey(h.body);
    const dup = this.store.data.facts.some(
      (f) => f.kind === "payment_habit" && f.status !== "failed" && normKey(bodyOf(f.text)) === key,
    );
    if (dup) return null;
    return this.saveFact(h.body, "payment_habit");
  }

  // ---- reads ----------------------------------------------------------

  async recallDetailed(query: string, opts: { limit?: number; maxDistance?: number } = {}): Promise<RecallDetail> {
    const limit = opts.limit ?? 5;
    const maxDistance = opts.maxDistance ?? this.o.defaultMaxDistance;
    const cacheKey = `${query}|${limit}|${maxDistance}`;
    try {
      this.limiter.consume(POINTS.recall);
      const res = await withTimeout(
        this.mem.recall({ query, limit: limit * 2, maxDistance, timeoutMs: this.o.recallTimeoutMs }),
        this.o.recallTimeoutMs,
        "recall",
      );
      const facts = dedupeRecalled(
        (res.results ?? [])
          .filter((m) => m.distance <= maxDistance)
          // Walrus memories are immutable: hide our own Day-1 spike write (blob 4yDG…mx8) from the product.
          .filter((m) => !/\[xenia-spike-\d+\]/.test(m.text))
          .map((m) => ({ text: m.text, distance: m.distance, blobId: m.blob_id, createdAt: m.created_at })),
      ).slice(0, limit);
      this.store.data.recallCache[cacheKey] = facts;
      this.store.save();
      return { facts, stale: false };
    } catch (e) {
      return { facts: this.store.data.recallCache[cacheKey] ?? [], stale: true, error: (e as Error).message };
    }
  }

  async recall(query: string, opts?: { limit?: number; maxDistance?: number }): Promise<RecalledFact[]> {
    return (await this.recallDetailed(query, opts)).facts;
  }

  async suggestionsForVisit(): Promise<Suggestion[]> {
    // Probes phrased like our stored "Label: body" texts. Measured on mainnet: "Usual order: flat white, oat
    // milk" -> 0.18, "Allergy: tree nuts allergy" -> 0.29, bare "allergy" -> 0.52, natural questions > 0.5.
    const queries = [
      "Usual order: flat white, oat milk",
      "Usual order: the drink and food the customer usually orders",
      "Allergy: tree nuts allergy",
      "Allergy: food allergies and intolerances of the customer",
      "Payment habit: settles tab on Fridays, typical payment 4.50 USDC",
    ];

    const recalled = (await Promise.all(queries.map((q) => this.recallDetailed(q, { limit: 8, maxDistance: 0.55 })))).flatMap((r) => r.facts);
    // Facts we wrote ourselves are known immediately, even before the index returns them.
    const local: RecalledFact[] = this.store.data.facts
      .filter((f) => f.status === "saved" && f.blobId)
      .map((f) => ({ text: f.text, distance: 0, blobId: f.blobId!, createdAt: f.createdAt }));
    return buildSuggestions(dedupeRecalled([...local, ...recalled]), this.o.now());
  }

  listFacts(): ProfileFact[] {
    return this.store.data.facts
      .map((f) => ({ ...f }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
