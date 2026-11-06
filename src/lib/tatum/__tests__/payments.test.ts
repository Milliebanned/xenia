import { beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { configureTatumLimits, setTatumClientForTests, USDC_COIN_TYPE, type TatumLike } from "../client";
import { clearVerifyMemoryCache, verifyUsdcPayment, getBalances, resolveName } from "../verify";
import { addCharge, listHistory, listOpenTab, settleWithPayment } from "../../tab";

// Shapes below were observed from real mainnet responses via Tatum (digest 6ZEL2t...).
const DIGEST = "6ZEL2tydFGaayLySMzoxdQAGquZoKy9w3ZUDtVthHSoP";
const PAYER = "0x0cf1f4739166a1407850986e462831e555a4a097bd7c15687db3af78ee9ffc23";
const PAYEE = "0x78a7ca88188061438fcaca8f8bd0fd4dcdd839a84edf5df8c4bdb54a78889ad4";
const SUI = "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";
const OTHER = "0x" + "ab".repeat(32);

function txResult(opts: { success?: boolean; coin?: string; amount?: string; payee?: string } = {}) {
  const { success = true, coin = USDC_COIN_TYPE, amount = "4500000", payee = PAYEE } = opts;
  const tx = {
    digest: DIGEST, signatures: [], epoch: "1302", timestampMs: 1793899004021, checkpoint: "341984914",
    status: { success, error: success ? null : { message: "MoveAbort" } },
    balanceChanges: [
      { coinType: SUI, address: PAYER, amount: "-1422631" },
      { coinType: coin, address: PAYER, amount: "-" + amount },
      { coinType: coin, address: payee, amount },
    ],
  };
  return success ? { $kind: "Transaction", Transaction: tx } : { $kind: "FailedTransaction", FailedTransaction: tx };
}

let getTransaction: ReturnType<typeof vi.fn>;
function install(impl: (...a: unknown[]) => unknown) {
  getTransaction = vi.fn(impl);
  setTatumClientForTests({
    core: { getTransaction, listBalances: vi.fn(async () => ({ balances: [
      { coinType: SUI, balance: "153150581", coinBalance: "153150581", addressBalance: "0" },
      { coinType: USDC_COIN_TYPE, balance: "998700400", coinBalance: "998700400", addressBalance: "0" },
    ] })) },
    nameService: { reverseLookupName: vi.fn(async () => ({ response: { record: { name: "shop.sui" } } })) },
  } as unknown as TatumLike);
}

beforeEach(() => {
  process.env.XENIA_DATA_DIR = mkdtempSync(path.join(tmpdir(), "xenia-test-"));
  configureTatumLimits({ minIntervalMs: 0, baseBackoffMs: 1, maxRetries: 3 });
  clearVerifyMemoryCache();
});

const args = (over = {}) => ({ digest: DIGEST, expectedPayee: PAYEE, minAmountUsdc: "4.50", ...over });

describe("verifyUsdcPayment", () => {
  it("accepts a real-shaped successful USDC transfer", async () => {
    install(async () => txResult());
    const r = await verifyUsdcPayment(args());
    expect(r).toMatchObject({ ok: true, amountUsdc: "4.50", payer: PAYER, payee: PAYEE, timestampMs: 1793899004021 });
  });
  it("rejects wrong payee", async () => {
    install(async () => txResult());
    const r = await verifyUsdcPayment(args({ expectedPayee: OTHER }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/no USDC credited/);
  });
  it("rejects too small amount", async () => {
    install(async () => txResult({ amount: "4499999" }));
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/underpaid/);
    expect(r.amountUsdc).toBe("4.499999");
  });
  it("rejects a failed tx", async () => {
    install(async () => txResult({ success: false }));
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/failed on-chain/);
  });
  it("rejects a non-USDC coin", async () => {
    install(async () => txResult({ coin: "0x" + "cd".repeat(32) + "::fake::USDC" }));
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(false);
  });
  it("handles NOT_FOUND", async () => {
    install(async () => { throw Object.assign(new Error("Transaction x not found"), { name: "TransactionError" }); });
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not found/);
  });
  it("retries on 429 (RpcError UNAVAILABLE) then succeeds", async () => {
    let n = 0;
    install(async () => {
      if (n++ < 2) throw Object.assign(new Error("Received HTTP status code 429"), { code: "UNAVAILABLE" });
      return txResult();
    });
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(true);
    expect(getTransaction).toHaveBeenCalledTimes(3);
  });
  it("gives up after max retries with a reason", async () => {
    install(async () => { throw Object.assign(new Error("Received HTTP status code 429"), { code: "UNAVAILABLE" }); });
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/429/);
    expect(getTransaction).toHaveBeenCalledTimes(4);
  });
  it("rejects bad input without calling Tatum", async () => {
    install(async () => txResult());
    for (const bad of [{ digest: "nope" }, { expectedPayee: "0xZZ" }, { minAmountUsdc: "-1" }, { minAmountUsdc: "1.1234567" }, { minAmountUsdc: "0" }]) {
      const r = await verifyUsdcPayment(args(bad));
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/bad input/);
    }
    expect(getTransaction).not.toHaveBeenCalled();
  });
  it("caches by digest (memory and store)", async () => {
    install(async () => txResult());
    await verifyUsdcPayment(args());
    await verifyUsdcPayment(args({ minAmountUsdc: "1.00" }));
    clearVerifyMemoryCache();
    const r = await verifyUsdcPayment(args());
    expect(r.ok).toBe(true);
    expect(getTransaction).toHaveBeenCalledTimes(1);
  });
});

describe("balances and names", () => {
  it("lists balances with decimal amounts", async () => {
    install(async () => txResult());
    const b = await getBalances(PAYEE);
    expect(b.find((x) => x.symbol === "USDC")?.amount).toBe("998.7004");
    expect(b.find((x) => x.symbol === "SUI")?.amount).toBe("0.153150581");
    expect(await resolveName(PAYEE)).toBe("shop.sui");
  });
  it("resolveName fails soft", async () => {
    setTatumClientForTests({ core: {}, nameService: { reverseLookupName: async () => { throw new Error("NOT_FOUND"); } } } as unknown as TatumLike);
    expect(await resolveName(PAYEE)).toBeNull();
  });
});

describe("tab ledger", () => {
  const pay = (digest: string, amountUsdc: string) => ({ digest, ok: true, amountUsdc });
  it("settles oldest first, splits a partial entry, uses integer math", async () => {
    await addCharge("c1", "s1", "3.10", "latte");
    await new Promise((r) => setTimeout(r, 3));
    await addCharge("c1", "s1", "2.00", "muffin");
    await addCharge("c2", "s1", "9.00"); // other customer untouched
    const r = await settleWithPayment("c1", "s1", pay("d1", "4.50"));
    expect(r).toMatchObject({ settled: true, appliedUsdc: "4.50", unappliedUsdc: "0.00" });
    const open = await listOpenTab("c1", "s1");
    expect(open).toHaveLength(1);
    expect(open[0].amountUsdc).toBe("0.60");
    expect(open[0].note).toBe("muffin");
    expect((await listHistory("c1", "s1")).filter((e) => e.settledByDigest === "d1")).toHaveLength(2);
    expect(await listOpenTab("c2", "s1")).toHaveLength(1);
  });
  it("prevents replay of the same digest", async () => {
    await addCharge("c1", "s1", "1.00");
    await addCharge("c1", "s1", "1.00");
    const a = await settleWithPayment("c1", "s1", pay("d2", "1.00"));
    const b = await settleWithPayment("c1", "s1", pay("d2", "1.00"));
    expect(a.settled).toBe(true);
    expect(b).toMatchObject({ settled: false, replay: true });
    expect(await listOpenTab("c1", "s1")).toHaveLength(1);
    // concurrent replay too
    const [x, y] = await Promise.all([settleWithPayment("c1", "s1", pay("d3", "1.00")), settleWithPayment("c1", "s1", pay("d3", "1.00"))]);
    expect([x.settled, y.settled].sort()).toEqual([false, true]);
  });
  it("reports overpayment as unapplied and refuses non-ok payments", async () => {
    await addCharge("c1", "s1", "1.00");
    const r = await settleWithPayment("c1", "s1", pay("d4", "5.00"));
    expect(r).toMatchObject({ appliedUsdc: "1.00", unappliedUsdc: "4.00" });
    const bad = await settleWithPayment("c1", "s1", { digest: "d5", ok: false, amountUsdc: "9", reason: "x" });
    expect(bad.settled).toBe(false);
  });
});
