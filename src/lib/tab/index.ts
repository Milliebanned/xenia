/** Tab ledger. All money is integer micro-USDC internally (bigint); TabEntry.amountUsdc is a decimal string. */
import { randomUUID } from "node:crypto";
import type { TabEntry, VerifiedPayment } from "../types";
import { mutateDb, readDb, type SettlementRecord } from "../store";
import { formatUsdc, parseUsdc } from "./money";

export { formatUsdc, parseUsdc } from "./money";

const ID_RE = /^[\w.:@-]{1,128}$/;
function checkId(name: string, v: string): void {
  if (typeof v !== "string" || !ID_RE.test(v)) throw new Error(`invalid ${name}`);
}

export async function addCharge(customerId: string, shopId: string, amountUsdc: string, note?: string): Promise<TabEntry> {
  checkId("customerId", customerId);
  checkId("shopId", shopId);
  const micro = parseUsdc(amountUsdc);
  if (micro <= BigInt(0)) throw new Error("amount must be > 0");
  const entry: TabEntry = {
    id: randomUUID(),
    customerId,
    shopId,
    amountUsdc: formatUsdc(micro),
    ...(note ? { note: note.slice(0, 200) } : {}),
    createdAt: new Date().toISOString(),
  };
  await mutateDb((db) => {
    db.tab.push(entry);
  });
  return entry;
}

const mine = (e: TabEntry, c: string, s: string) => e.customerId === c && e.shopId === s;
const byAge = (a: TabEntry, b: TabEntry) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/** Open (unsettled) entries, oldest first. */
export async function listOpenTab(customerId: string, shopId: string): Promise<TabEntry[]> {
  const all = await readDb((db) => db.tab);
  return all.filter((e) => mine(e, customerId, shopId) && !e.settledByDigest).sort(byAge);
}

/** All entries (open and settled), newest first. */
export async function listHistory(customerId: string, shopId: string): Promise<TabEntry[]> {
  const all = await readDb((db) => db.tab);
  return all.filter((e) => mine(e, customerId, shopId)).sort(byAge).reverse();
}

export function openTotalUsdc(entries: TabEntry[]): string {
  return formatUsdc(entries.filter((e) => !e.settledByDigest).reduce((s, e) => s + parseUsdc(e.amountUsdc), BigInt(0)));
}

export interface SettleResult {
  /** false if the payment was not ok, or the digest was already used (replay). */
  settled: boolean;
  replay: boolean;
  reason?: string;
  appliedUsdc: string;
  /** paid but not applied (overpayment / empty tab) */
  unappliedUsdc: string;
  settledEntries: TabEntry[];
}

/**
 * Settle the oldest open entries up to the verified amount. Each digest settles at most once (replay protection,
 * enforced inside one serialized transaction). If the payment covers an entry only partially, that entry is split:
 * the paid part is marked settled, the remainder stays open (same createdAt, so ordering is kept).
 */
export function settleWithPayment(customerId: string, shopId: string, payment: VerifiedPayment): Promise<SettleResult> {
  const none = (reason: string, replay = false, unapplied = "0.00"): SettleResult => ({
    settled: false, replay, reason, appliedUsdc: "0.00", unappliedUsdc: unapplied, settledEntries: [],
  });
  if (!payment.ok) return Promise.resolve(none(payment.reason ?? "payment not verified"));
  return mutateDb((db): SettleResult => {
    if (db.settlements[payment.digest]) return none("digest already used to settle a tab (replay)", true);
    const paid = parseUsdc(payment.amountUsdc);
    let remaining = paid;
    const settledEntries: TabEntry[] = [];
    const at = new Date().toISOString();
    const open = db.tab.filter((e) => mine(e, customerId, shopId) && !e.settledByDigest).sort(byAge);
    for (const e of open) {
      if (remaining <= BigInt(0)) break;
      const amt = parseUsdc(e.amountUsdc);
      if (amt <= remaining) {
        e.settledByDigest = payment.digest;
        e.settledAt = at;
        remaining -= amt;
        settledEntries.push({ ...e });
      } else {
        // partial: split
        db.tab.push({ ...e, id: randomUUID(), amountUsdc: formatUsdc(amt - remaining) });
        e.amountUsdc = formatUsdc(remaining);
        e.settledByDigest = payment.digest;
        e.settledAt = at;
        remaining = BigInt(0);
        settledEntries.push({ ...e });
      }
    }
    const applied = paid - remaining;
    const rec: SettlementRecord = {
      digest: payment.digest, customerId, shopId,
      paidMicro: paid.toString(), appliedMicro: applied.toString(), unappliedMicro: remaining.toString(),
      settledEntryIds: settledEntries.map((x) => x.id), at,
    };
    db.settlements[payment.digest] = rec;
    return {
      settled: applied > BigInt(0), replay: false,
      ...(applied === BigInt(0) ? { reason: "no open tab entries to settle" } : {}),
      appliedUsdc: formatUsdc(applied), unappliedUsdc: formatUsdc(remaining), settledEntries,
    };
  });
}
