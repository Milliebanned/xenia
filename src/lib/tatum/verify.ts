/**
 * Payment verification via Tatum gRPC (LedgerService.GetTransaction through SuiGrpcClient.core.getTransaction).
 * Read-only. ok=true only if: tx executed successfully, and a USDC balance change credits expectedPayee
 * with >= minAmountUsdc.
 */
import type { VerifiedPayment } from "../types";
import { formatUsdc, parseUsdc } from "../tab/money";
import { mutateDb, readDb, type CachedTx } from "../store";
import { getTatumClient, isNotFound, tatumCall, USDC_COIN_TYPE } from "./client";

const DIGEST_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/; // base58 of 32 bytes

/** Normalize a Sui address to 0x + 64 lowercase hex; null if invalid. */
export function normalizeAddress(a: string): string | null {
  if (typeof a !== "string") return null;
  const m = /^0x([0-9a-fA-F]{1,64})$/.exec(a.trim());
  return m ? `0x${m[1].toLowerCase().padStart(64, "0")}` : null;
}

/** Normalize a coin type's leading address (0x2::sui::SUI == 0x000..2::sui::SUI). */
function normalizeCoinType(t: string): string {
  const i = t.indexOf("::");
  if (i < 0) return t;
  const addr = normalizeAddress(t.slice(0, i));
  return `${addr ?? t.slice(0, i)}${t.slice(i)}`;
}
const USDC_NORM = normalizeCoinType(USDC_COIN_TYPE);

const memCache = new Map<string, CachedTx>();
/** Test hook. */
export function clearVerifyMemoryCache(): void {
  memCache.clear();
}

function fail(digest: string, reason: string, extra: Partial<VerifiedPayment> = {}): VerifiedPayment {
  return { digest, ok: false, amountUsdc: "0.00", reason, ...extra };
}

async function fetchTx(digest: string): Promise<CachedTx> {
  const hit = memCache.get(digest);
  if (hit) return hit;
  const stored = await readDb((db) => db.txCache[digest]);
  if (stored) {
    memCache.set(digest, stored);
    return stored;
  }
  const res = await tatumCall(() =>
    getTatumClient().core.getTransaction({ digest, include: { balanceChanges: true } }),
  );
  const tx = res.$kind === "Transaction" ? res.Transaction : res.FailedTransaction;
  const usdcChanges: Record<string, string> = {};
  for (const bc of tx.balanceChanges ?? []) {
    if (normalizeCoinType(bc.coinType) !== USDC_NORM) continue;
    const addr = normalizeAddress(bc.address) ?? bc.address;
    usdcChanges[addr] = (BigInt(usdcChanges[addr] ?? "0") + BigInt(bc.amount)).toString();
  }
  const entry: CachedTx = {
    digest,
    success: tx.status.success,
    timestampMs: tx.timestampMs,
    usdcChanges,
    cachedAt: new Date().toISOString(),
  };
  // Cache only finalized (checkpointed) txs: immutable on-chain facts.
  if (tx.timestampMs != null) {
    memCache.set(digest, entry);
    await mutateDb((db) => {
      db.txCache[digest] = entry;
    });
  }
  return entry;
}

export async function verifyUsdcPayment(input: {
  digest: string;
  expectedPayee: string;
  minAmountUsdc: string;
}): Promise<VerifiedPayment> {
  const digest = typeof input?.digest === "string" ? input.digest.trim() : "";
  if (!DIGEST_RE.test(digest)) return fail(String(digest), "bad input: invalid transaction digest");
  const payee = normalizeAddress(input.expectedPayee);
  if (!payee) return fail(digest, "bad input: invalid expectedPayee address");
  let min: bigint;
  try {
    min = parseUsdc(input.minAmountUsdc);
  } catch {
    return fail(digest, "bad input: invalid minAmountUsdc");
  }
  if (min <= BigInt(0)) return fail(digest, "bad input: minAmountUsdc must be > 0");

  let tx: CachedTx;
  try {
    tx = await fetchTx(digest);
  } catch (e) {
    if (isNotFound(e)) {
      return fail(digest, "transaction not found (unknown digest, not yet indexed, or pruned by the node)");
    }
    const msg = (e as Error)?.message ?? String(e);
    if (/INVALID_ARGUMENT|invalid digest/i.test(msg)) return fail(digest, "bad input: invalid transaction digest");
    return fail(digest, `could not verify via Tatum: ${msg.slice(0, 200)}`);
  }

  const changes = Object.entries(tx.usdcChanges).map(([a, v]) => [a, BigInt(v)] as const);
  // payer = the address with the largest USDC debit
  let payer: string | undefined;
  let worst = BigInt(0);
  for (const [a, v] of changes) {
    if (v < worst) {
      worst = v;
      payer = a;
    }
  }
  const base = { payer, payee, coinType: USDC_COIN_TYPE, timestampMs: tx.timestampMs ?? undefined };

  if (!tx.success) return fail(digest, "transaction failed on-chain", base);
  const credited = changes.find(([a]) => a === payee)?.[1] ?? BigInt(0);
  if (credited <= BigInt(0)) {
    return fail(digest, "no USDC credited to the expected payee in this transaction", base);
  }
  const amountUsdc = formatUsdc(credited);
  if (credited < min) {
    return { digest, ok: false, amountUsdc, ...base, reason: `underpaid: ${amountUsdc} USDC < required ${formatUsdc(min)}` };
  }
  return { digest, ok: true, amountUsdc, ...base };
}

export interface Balance {
  coinType: string;
  symbol?: string;
  /** raw integer string in the coin's smallest unit */
  raw: string;
  /** decimal string; only set for USDC (6 decimals) and SUI (9) */
  amount?: string;
}

export async function getBalances(address: string): Promise<Balance[]> {
  const owner = normalizeAddress(address);
  if (!owner) throw new Error("invalid Sui address");
  const res = await tatumCall(() => getTatumClient().core.listBalances({ owner }));
  return res.balances.map((b) => {
    const t = normalizeCoinType(b.coinType);
    if (t === USDC_NORM) return { coinType: b.coinType, symbol: "USDC", raw: b.balance, amount: formatUsdc(BigInt(b.balance)) };
    if (t.endsWith("::sui::SUI") && t.startsWith("0x" + "0".repeat(63) + "2")) {
      const v = BigInt(b.balance);
      const frac = (v % BigInt(1000000000)).toString().padStart(9, "0").replace(/0+$/, "").padEnd(2, "0");
      return { coinType: b.coinType, symbol: "SUI", raw: b.balance, amount: `${v / BigInt(1000000000)}.${frac}` };
    }
    return { coinType: b.coinType, raw: b.balance };
  });
}

/** SuiNS reverse lookup; fails soft (returns null on any error or no name). */
export async function resolveName(address: string): Promise<string | null> {
  try {
    const a = normalizeAddress(address);
    const ns = getTatumClient().nameService;
    if (!a || !ns) return null;
    const r = await tatumCall(async () => (await ns.reverseLookupName({ address: a })).response);
    return r.record?.name ?? null;
  } catch {
    return null;
  }
}
