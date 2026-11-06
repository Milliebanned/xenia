/**
 * Visit lifecycle service (server-only). Built as a factory so tests can inject a mock relayer,
 * mock MemWal, fake clock and in-memory store. The default wired instance is in ./index.ts.
 *
 * Security invariants:
 *  - The shop's per-visit private key is generated here, stored only in VisitStore (server disk),
 *    and used only to construct a server-side MemWal client. It is never returned.
 *  - `toPublicState` is the only mapping from VisitRecord to anything serializable.
 *  - Shop recall is limited to the profile namespace + distance cutoff.
 */
import type { RecalledFact } from "@/lib/types";
import {
  VisitError,
  type CreateVisitResult,
  type RevokeStartResult,
  type ShopRecallResult,
  type VisitState,
  type WalletAction,
} from "./types";
import type { VisitRecord, VisitStore } from "./store";
import type { RelayerConfig } from "./relayer";
import type { RelayerDelegateKeys } from "./types";

export interface ShopMemwal {
  recall(params: { query: string; limit?: number; maxDistance?: number }): Promise<{
    results: { blob_id: string; text: string; distance: number; created_at?: string }[];
  }>;
  destroy(): void;
}

export interface VisitDeps {
  store: VisitStore;
  serverUrl: string;
  /** Namespace on the customer's profile account that holds shareable profile facts. */
  profileNamespace: string;
  getConfig(): Promise<RelayerConfig>;
  fetchDelegateKeys(ownerAddress: string): Promise<RelayerDelegateKeys>;
  resolveOwner(accountId: string): Promise<string>;
  generateKey(): Promise<{ privateKey: string; publicKeyHex: string }>;
  createMemwal(o: { key: string; accountId: string; serverUrl: string; namespace: string }): ShopMemwal;
  now(): number;
  sleep(ms: number): Promise<void>;
  newId(): string;
  log(line: string): void;
}

export interface PollOpts {
  /** Max time to wait for the relayer to reflect the on-chain change. */
  timeoutMs?: number;
  intervalMs?: number;
}

const DEFAULT_GRANT_TIMEOUT = 60_000;
const DEFAULT_REVOKE_LIST_TIMEOUT = 60_000;
const DEFAULT_DENY_TIMEOUT = 90_000;
const DEFAULT_INTERVAL = 2_000;
const MAX_DISTANCE = 0.5;
const HEX64 = /^[0-9a-f]{64}$/;

/** Auth rejection as thrown by the MemWal SDK (verified: status 401, serverCode AUTH_REJECTED). */
export function isAuthRejection(e: unknown): boolean {
  const x = e as { status?: number; serverCode?: string } | null;
  return !!x && (x.status === 401 || x.status === 403 || x.serverCode === "AUTH_REJECTED");
}

export function toPublicState(rec: VisitRecord): VisitState {
  // Explicit whitelist: do NOT spread rec, it holds delegatePrivateKey.
  return {
    session: { ...rec.session },
    ownerAddress: rec.ownerAddress,
    timings: { ...rec.timings, evidence: [...rec.timings.evidence] },
    ...(rec.lastError ? { lastError: rec.lastError } : {}),
  };
}

export function createVisitService(deps: VisitDeps) {
  const clients = new Map<string, ShopMemwal>();
  const iso = () => new Date(deps.now()).toISOString();

  async function load(visitId: string): Promise<VisitRecord> {
    if (!visitId || typeof visitId !== "string") throw new VisitError("visitId required", "bad_request", 400);
    const rec = await deps.store.get(visitId);
    if (!rec) throw new VisitError("visit not found", "not_found", 404);
    return rec;
  }

  function dropClient(visitId: string) {
    const c = clients.get(visitId);
    if (c) {
      try {
        c.destroy();
      } catch {
        /* ignore */
      }
      clients.delete(visitId);
    }
  }

  function clientFor(rec: VisitRecord): ShopMemwal {
    let c = clients.get(rec.session.id);
    if (!c) {
      c = deps.createMemwal({
        key: rec.delegatePrivateKey,
        accountId: rec.session.customerAccountId,
        serverUrl: deps.serverUrl,
        namespace: deps.profileNamespace,
      });
      clients.set(rec.session.id, c);
    }
    return c;
  }

  async function walletAction(rec: VisitRecord): Promise<WalletAction> {
    const cfg = await deps.getConfig();
    return {
      packageId: cfg.packageId,
      registryId: cfg.registryId,
      accountId: rec.session.customerAccountId,
      publicKey: rec.session.delegatePublicKey,
      label: `Xenia visit ${rec.session.shopId} ${rec.session.id.slice(0, 8)}`,
      ownerAddress: rec.ownerAddress,
    };
  }

  /** Is our key listed? Throws on relayer/network errors; throws VisitError("mismatch") on wrong account. */
  async function keyListed(rec: VisitRecord): Promise<boolean> {
    const r = await deps.fetchDelegateKeys(rec.ownerAddress);
    if (r.account_id && r.account_id.toLowerCase() !== rec.session.customerAccountId.toLowerCase()) {
      throw new VisitError("owner's account does not match customerAccountId", "mismatch", 409);
    }
    const want = rec.session.delegatePublicKey.toLowerCase();
    return r.keys.some((k) => k.public_key.toLowerCase() === want);
  }

  /** Poll until `listed === wantListed`. Transient fetch errors are retried until the deadline. */
  async function pollList(
    rec: VisitRecord,
    wantListed: boolean,
    t0: number,
    o: Required<PollOpts>,
  ): Promise<{ ok: boolean; elapsedMs: number; lastError?: string }> {
    let lastError: string | undefined;
    for (;;) {
      try {
        if ((await keyListed(rec)) === wantListed) return { ok: true, elapsedMs: deps.now() - t0 };
        lastError = undefined;
      } catch (e) {
        if (e instanceof VisitError && e.code === "mismatch") throw e;
        lastError = e instanceof Error ? e.message : String(e);
      }
      if (deps.now() - t0 >= o.timeoutMs) return { ok: false, elapsedMs: deps.now() - t0, lastError };
      await deps.sleep(o.intervalMs);
    }
  }

  function emit(rec: VisitRecord, line: string) {
    rec.timings.evidence.push(line);
    deps.log(`[visit-evidence] ${line}`);
  }

  return {
    async createVisit(input: {
      shopId: string;
      customerAccountId: string;
      ownerAddress?: string;
    }): Promise<CreateVisitResult> {
      const shopId = input.shopId?.trim();
      const accountId = input.customerAccountId?.trim();
      if (!shopId) throw new VisitError("shopId required", "bad_request", 400);
      if (!accountId) throw new VisitError("customerAccountId required", "bad_request", 400);
      const ownerAddress = input.ownerAddress?.trim() || (await deps.resolveOwner(accountId));
      const key = await deps.generateKey();
      if (!HEX64.test(key.publicKeyHex)) throw new Error("generated public key is not 32-byte hex");
      const rec: VisitRecord = {
        session: {
          id: deps.newId(),
          shopId,
          customerAccountId: accountId,
          delegatePublicKey: key.publicKeyHex,
          grantedAt: iso(), // creation time; updated to the confirmed time on grant
          status: "pending",
        },
        ownerAddress,
        delegatePrivateKey: key.privateKey,
        timings: { evidence: [] },
      };
      await deps.store.put(rec);
      return {
        ...toPublicState(rec),
        walletAction: await walletAction(rec),
        qr: {
          shopId,
          visitId: rec.session.id,
          publicKey: key.publicKeyHex,
          accountId,
        },
      };
    },

    /** Customer signed addDelegateKey (digest). Polls the relayer list until the key shows up. */
    async confirmGrant(visitId: string, digest: string, opts: PollOpts = {}): Promise<VisitState> {
      if (!digest || typeof digest !== "string") throw new VisitError("digest required", "bad_request", 400);
      const rec = await load(visitId);
      if (rec.session.status === "active") return toPublicState(rec);
      if (rec.session.status !== "pending" && rec.session.status !== "failed") {
        throw new VisitError(`cannot confirm grant from status ${rec.session.status}`, "bad_state", 409);
      }
      const t0 = deps.now();
      rec.session.grantDigest = digest;
      rec.timings.grantSubmittedAt = iso();
      const res = await pollList(rec, true, t0, {
        timeoutMs: opts.timeoutMs ?? DEFAULT_GRANT_TIMEOUT,
        intervalMs: opts.intervalMs ?? DEFAULT_INTERVAL,
      });
      if (res.ok) {
        rec.session.status = "active";
        rec.session.grantedAt = iso();
        rec.timings.grantListedMs = res.elapsedMs;
        rec.lastError = undefined;
        emit(
          rec,
          `grant: key ${rec.session.delegatePublicKey.slice(0, 8)}.. listed by relayer ${res.elapsedMs}ms after digest ${digest} was submitted`,
        );
      } else {
        rec.session.status = "failed";
        rec.lastError = `key not listed by relayer after ${res.elapsedMs}ms${res.lastError ? ` (last error: ${res.lastError})` : ""}`;
      }
      await deps.store.put(rec);
      return toPublicState(rec);
    },

    async getState(visitId: string): Promise<VisitState> {
      return toPublicState(await load(visitId));
    },

    /** Shop-side read: profile namespace only, distance-cutoff filtered. */
    async recallAsShop(
      visitId: string,
      query: string,
      o: { limit?: number } = {},
    ): Promise<ShopRecallResult> {
      if (!query?.trim()) throw new VisitError("query required", "bad_request", 400);
      const rec = await load(visitId);
      if (rec.session.status !== "active") {
        throw new VisitError(`visit is ${rec.session.status}, shop has no access`, "bad_state", 409);
      }
      const res = await clientFor(rec).recall({
        query,
        limit: o.limit ?? 10,
        maxDistance: MAX_DISTANCE,
      });
      const facts: RecalledFact[] = res.results
        .filter((r) => r.distance <= MAX_DISTANCE)
        .map((r) => ({ text: r.text, distance: r.distance, blobId: r.blob_id, createdAt: r.created_at }));
      return { visitId, facts };
    },

    /** Returns what the owner's wallet must sign (removeDelegateKey). */
    async startRevoke(visitId: string): Promise<RevokeStartResult> {
      const rec = await load(visitId);
      if (rec.session.status !== "active" && rec.session.status !== "revoking") {
        throw new VisitError(`cannot revoke from status ${rec.session.status}`, "bad_state", 409);
      }
      rec.session.status = "revoking";
      await deps.store.put(rec);
      return { ...toPublicState(rec), walletAction: await walletAction(rec) };
    },

    /**
     * Customer signed removeDelegateKey (digest). Measures (1) time until the relayer's delegate-keys
     * list drops the key and (2) time until a shop recall with that key is rejected with an auth error.
     * If the list never drops the key, status stays "revoking" (the key may still be live).
     */
    async confirmRevoke(
      visitId: string,
      digest: string,
      opts: PollOpts & { denyTimeoutMs?: number } = {},
    ): Promise<VisitState> {
      if (!digest || typeof digest !== "string") throw new VisitError("digest required", "bad_request", 400);
      const rec = await load(visitId);
      if (rec.session.status === "revoked") return toPublicState(rec);
      if (rec.session.status !== "revoking" && rec.session.status !== "active") {
        throw new VisitError(`cannot confirm revoke from status ${rec.session.status}`, "bad_state", 409);
      }
      const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL;
      const t0 = deps.now();
      rec.session.status = "revoking";
      rec.session.revokeDigest = digest;
      rec.timings.revokeSubmittedAt = iso();
      rec.timings.recallProbes = 0;

      const gone = await pollList(rec, false, t0, {
        timeoutMs: opts.timeoutMs ?? DEFAULT_REVOKE_LIST_TIMEOUT,
        intervalMs,
      });
      if (!gone.ok) {
        rec.lastError = `key still listed by relayer after ${gone.elapsedMs}ms${gone.lastError ? ` (last error: ${gone.lastError})` : ""}`;
        await deps.store.put(rec);
        return toPublicState(rec);
      }
      rec.timings.keyRemovedFromListMs = gone.elapsedMs;
      const tGone = deps.now();

      // Probe the shop's recall until the relayer rejects it.
      const denyDeadline = tGone + (opts.denyTimeoutMs ?? DEFAULT_DENY_TIMEOUT);
      let denied: { status?: number; code?: string } | null = null;
      let lastProbe = "still accepted";
      for (;;) {
        rec.timings.recallProbes = (rec.timings.recallProbes ?? 0) + 1;
        try {
          await clientFor(rec).recall({ query: "profile", limit: 1, maxDistance: MAX_DISTANCE });
          lastProbe = "recall still accepted";
        } catch (e) {
          if (isAuthRejection(e)) {
            const x = e as { status?: number; serverCode?: string };
            denied = { status: x.status, code: x.serverCode };
            break;
          }
          lastProbe = `non-auth error: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`;
        }
        if (deps.now() >= denyDeadline) break;
        await deps.sleep(intervalMs);
      }
      dropClient(rec.session.id);

      rec.session.status = "revoked";
      rec.session.revokedAt = iso();
      if (denied) {
        const total = deps.now() - t0;
        rec.timings.shopRecallDeniedMs = total;
        rec.timings.deniedAfterListMs = deps.now() - tGone;
        rec.lastError = undefined;
        emit(
          rec,
          `revoke: key removed from relayer list ${gone.elapsedMs}ms after digest ${digest}; shop recall rejected (HTTP ${denied.status ?? "?"}${denied.code ? ` ${denied.code}` : ""}) ${total}ms after digest, ${rec.timings.deniedAfterListMs}ms after list removal, ${rec.timings.recallProbes} probe(s)`,
        );
      } else {
        rec.timings.shopRecallDeniedMs = null;
        rec.timings.deniedAfterListMs = null;
        rec.lastError = `key removed on-chain/list but shop recall NOT rejected within window (${lastProbe})`;
        emit(rec, `revoke: ${rec.lastError}; probes=${rec.timings.recallProbes}`);
      }
      await deps.store.put(rec);
      return toPublicState(rec);
    },
  };
}

export type VisitService = ReturnType<typeof createVisitService>;
