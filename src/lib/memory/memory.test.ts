import { describe, expect, it, vi } from "vitest";
import { XeniaMemory, type MemWalLike } from "./service";
import { JsonStore } from "./store";
import { PointLimiter, withTimeout } from "./limiter";
import { buildSuggestions, deriveHabit, dedupeRecalled, type EvidenceFact } from "./learning";

const mem = (o: Partial<MemWalLike> = {}): MemWalLike => ({
  rememberAsync: vi.fn(async () => ({ job_id: "job1", status: "pending" })),
  waitForRememberJob: vi.fn(async () => ({ id: "job1", blob_id: "blob1", owner: "o", namespace: "n" })),
  waitForRememberJobs: vi.fn(async () => ({ results: [], total: 0, succeeded: 0, failed: 0 })),
  recall: vi.fn(async () => ({ results: [], total: 0 })),
  analyze: vi.fn(async () => ({ job_ids: [], facts: [], fact_count: 0, status: "ok", owner: "o" })),
  ...o,
});
const make = (m: MemWalLike, o = {}) =>
  new XeniaMemory(m, {
    store: new JsonStore(null),
    now: () => new Date("2026-11-05T10:00:00Z"), // a Thursday
    recallTimeoutMs: 30,
    ...o,
  });
const rf = (text: string, blobId: string, distance = 0.2, createdAt?: string) => ({ text, blobId, distance, createdAt });
const hit = (text: string, blob_id: string, distance = 0.2) => ({ text, blob_id, distance });

describe("background writes", () => {
  it("returns saving immediately, then saved with blobId", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const m = mem({
      waitForRememberJob: vi.fn(async () => {
        await gate;
        return { id: "j", blob_id: "BLOB", owner: "o", namespace: "n" };
      }),
    });
    const svc = make(m);
    const f = await svc.saveFact("flat white, oat milk", "order");
    expect(f.status).toBe("saving");
    expect(f.text).toBe("[2026-11-05] Usual order: flat white, oat milk");
    release();
    await svc.idle();
    const [saved] = svc.listFacts();
    expect(saved.status).toBe("saved");
    expect(saved.blobId).toBe("BLOB");
    expect(saved.jobId).toBe("job1");
    const opts = (m.rememberAsync as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(opts.idempotencyKey).toMatch(/^xenia-/);
  });

  it("marks failed with error after retry, and same text is not written twice while live", async () => {
    const m = mem({ rememberAsync: vi.fn(async () => { throw new Error("relayer 500"); }) });
    const svc = make(m);
    await svc.saveFact("tree nuts", "allergy");
    await svc.idle();
    expect(svc.listFacts()[0]).toMatchObject({ status: "failed", error: "relayer 500" });
    expect(m.rememberAsync).toHaveBeenCalledTimes(2);

    const ok = mem();
    const s2 = make(ok);
    const a = await s2.saveFact("tree nuts", "allergy");
    const b = await s2.saveFact("tree nuts", "allergy");
    await s2.idle();
    expect(b.localId).toBe(a.localId);
    expect(ok.rememberAsync).toHaveBeenCalledTimes(1);
  });

  it("learnFromText maps analyzed facts to kinds and resolves them in background", async () => {
    const m = mem({
      analyze: vi.fn(async () => ({
        job_ids: ["a", "b"],
        fact_count: 2,
        status: "ok",
        owner: "o",
        facts: [
          { text: "Customer is allergic to tree nuts", id: "a", job_id: "a" },
          { text: "Customer's usual order is a flat white", id: "b", job_id: "b" },
        ],
      })),
      waitForRememberJobs: vi.fn(async () => ({
        total: 2, succeeded: 2, failed: 0,
        results: [
          { id: "a", blob_id: "BA", status: "done" as const, namespace: "n" },
          { id: "b", blob_id: "BB", status: "done" as const, namespace: "n" },
        ],
      })),
    });
    const svc = make(m);
    const facts = await svc.learnFromText("I like flat white, nut allergy");
    expect(facts.map((f) => f.kind).sort()).toEqual(["allergy", "order"]);
    expect(facts.every((f) => f.status === "saving")).toBe(true);
    await svc.idle();
    expect(svc.listFacts().map((f) => f.blobId).sort()).toEqual(["BA", "BB"]);
  });
});

describe("queue / throttle", () => {
  it("makes the 3rd remember wait when the point budget is exhausted", async () => {
    let t = 0;
    const sleeps: number[] = [];
    const limiter = new PointLimiter(10, 60_000, () => t, async (ms) => { sleeps.push(ms); t += ms; });
    const order: number[] = [];
    await Promise.all([1, 2, 3].map((i) => limiter.acquire(5).then(() => order.push(i))));
    expect(order).toEqual([1, 2, 3]); // FIFO
    expect(sleeps.length).toBe(1);
    expect(t).toBeGreaterThanOrEqual(60_000); // third waited for the window to slide
  });

  it("saveFact never blocks on the limiter", async () => {
    const limiter = new PointLimiter(5, 60_000, () => 0, () => new Promise(() => undefined)); // sleeps forever
    const svc = make(mem(), { limiter });
    await svc.saveFact("a", "preference");
    const second = await svc.saveFact("b", "preference");
    expect(second.status).toBe("saving");
  });
});

describe("recall", () => {
  it("filters by maxDistance (default 0.5) and de-duplicates", async () => {
    const m = mem({
      recall: vi.fn(async () => ({
        total: 4,
        results: [
          hit("[2026-11-05] Usual order: flat white, oat milk.", "b1", 0.2),
          hit("[2026-11-05] Usual order: flat white, oat milk", "b2", 0.25), // near-identical
          hit("Something unrelated", "b3", 0.6), // too far
          hit("[2026-11-01] Usual order: cortado", "b4", 0.4),
        ],
      })),
    });
    const r = await make(m, { recallTimeoutMs: 500 }).recall("order");
    expect(r.map((x) => x.blobId)).toEqual(["b1", "b4"]);
    expect(dedupeRecalled([rf("x y z", "1"), rf("x y z", "2")]).length).toBe(1);
  });

  it("falls back to cached results on timeout and never throws", async () => {
    const recall = vi
      .fn()
      .mockResolvedValueOnce({ total: 1, results: [hit("[2026-11-05] Allergy: tree nuts", "b1", 0.1)] })
      .mockImplementationOnce(() => new Promise(() => undefined)); // hangs forever (upstream #1367)
    const svc = make(mem({ recall }));
    const ok = await svc.recallDetailed("allergy", { limit: 5 });
    expect(ok.stale).toBe(false);
    const t0 = Date.now();
    const slow = await svc.recallDetailed("allergy", { limit: 5 });
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(slow.stale).toBe(true);
    expect(slow.facts[0].blobId).toBe("b1");
    expect(slow.error).toMatch(/timed out/);
    // no cache + error -> empty, not a throw
    const svc2 = make(mem({ recall: vi.fn(async () => { throw new Error("boom"); }) }));
    expect(await svc2.recall("q")).toEqual([]);
  });

  it("withTimeout rejects", async () => {
    await expect(withTimeout(new Promise(() => undefined), 10, "x")).rejects.toThrow(/timed out/);
  });
});

describe("suggestions: the learning loop", () => {
  const now = new Date("2026-11-05T10:00:00Z"); // Thursday

  it("usual order with the newest fact winning and the older shown as superseded", () => {
    const s = buildSuggestions(
      [
        rf("[2026-10-01] Usual order: flat white, oat milk.", "old"),
        rf("[2026-11-05] Usual order: cortado, no sugar.", "new"),
      ],
      now,
    );
    const o = s.find((x) => x.kind === "usual_order")!;
    expect(o.headline).toBe("Usual: cortado, no sugar");
    expect(o.because.map((b) => b.blobId)).toEqual(["new", "old"]);
    const old = o.because[1] as EvidenceFact;
    expect(old.superseded).toBe(true);
    expect(old.supersededBy).toBe("new");
    expect((o.because[0] as EvidenceFact).superseded).toBeUndefined();
  });

  it("repeated same order is corroboration, not supersession", () => {
    const s = buildSuggestions(
      [rf("[2026-10-01] Usual order: flat white, oat milk.", "a"), rf("[2026-11-02] Usual order: Flat white with oat milk", "b")],
      now,
    );
    const o = s.find((x) => x.kind === "usual_order")!;
    expect(o.because.every((b) => !(b as EvidenceFact).superseded)).toBe(true);
    expect(o.because).toHaveLength(2);
  });

  it("always surfaces allergies with evidence", () => {
    const s = buildSuggestions([rf("Customer is allergic to tree nuts", "al", 0.3, "2026-10-01T00:00:00Z")], now);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ kind: "allergy_warning" });
    expect(s[0].because[0].blobId).toBe("al");
  });

  it("tab reminder on the habit weekday, day before, else plain habit", () => {
    const habit = [rf("[2026-10-20] Payment habit: settles tab on Fridays; typical payment 4.50 USDC.", "h")];
    expect(buildSuggestions(habit, new Date("2026-11-06T10:00:00Z"))[0]).toMatchObject({ kind: "tab_reminder" });
    expect(buildSuggestions(habit, now)[0]).toMatchObject({ kind: "tab_reminder" }); // Thursday: tomorrow
    const mon = buildSuggestions(habit, new Date("2026-11-02T10:00:00Z"))[0];
    expect(mon.kind).toBe("habit");
    expect(mon.headline).toContain("Fridays");
    expect(mon.headline).toContain("4.50");
    expect(mon.because[0].blobId).toBe("h");
  });

  it("suggestionsForVisit recalls, merges and attaches evidence end to end", async () => {
    const m = mem({
      recall: vi.fn(async () => ({
        total: 2,
        results: [hit("[2026-11-05] Usual order: flat white, oat milk.", "o1"), hit("[2026-11-05] Allergy: tree nuts.", "a1")],
      })),
    });
    const s = await make(m, { recallTimeoutMs: 500 }).suggestionsForVisit();
    expect(s.map((x) => x.kind).sort()).toEqual(["allergy_warning", "usual_order"]);
    expect(s.every((x) => x.because.length > 0)).toBe(true);
  });
});

describe("observed payments -> payment_habit", () => {
  const day = (iso: string) => Date.parse(iso);
  it("needs >= 3 observations", () => {
    expect(deriveHabit([{ digest: "a", timestampMs: day("2026-10-23T10:00:00Z"), amountUsdc: 4.5 }])).toBeNull();
  });
  it("derives usual weekday and median amount", () => {
    const h = deriveHabit([
      { digest: "a", timestampMs: day("2026-10-16T10:00:00Z"), amountUsdc: "4.50" }, // Fri
      { digest: "b", timestampMs: day("2026-10-23T10:00:00Z"), amountUsdc: "5.00" }, // Fri
      { digest: "c", timestampMs: day("2026-10-30T10:00:00Z"), amountUsdc: "4.50" }, // Fri
      { digest: "d", timestampMs: day("2026-10-27T10:00:00Z"), amountUsdc: "9.00" }, // Tue
    ])!;
    expect(h.weekday).toBe(5);
    expect(h.typicalAmount).toBe("4.75");
    expect(h.body).toContain("Fridays");
  });
  it("service saves the habit once", async () => {
    const svc = make(mem());
    const p = [16, 23, 30].map((d, i) => ({ digest: `d${i}`, timestampMs: day(`2026-10-${d}T10:00:00Z`), amountUsdc: 4.5 }));
    const f = await svc.observePayments(p);
    expect(f?.kind).toBe("payment_habit");
    await svc.idle();
    expect(await svc.observePayments(p)).toBeNull();
    expect(svc.listFacts()).toHaveLength(1);
  });
});
