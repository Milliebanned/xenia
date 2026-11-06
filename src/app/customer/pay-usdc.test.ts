import { describe, expect, it } from "vitest";
import { buildUsdcTransfer, selectCoins, USDC_TYPE } from "./pay-usdc";

const OWNER = "0x" + "a".repeat(64);
const SHOP = "0x" + "b".repeat(64);
const coin = (n: number, bal: string) => ({ objectId: "0x" + n.toString(16).padStart(64, "0"), balance: bal });

function client(pages: ReturnType<typeof coin>[][]) {
  const calls: unknown[] = [];
  return {
    calls,
    listCoins: async (o: { cursor?: string | null }) => {
      calls.push(o);
      const i = o.cursor ? Number(o.cursor) : 0;
      return { objects: pages[i], hasNextPage: i < pages.length - 1, cursor: String(i + 1) };
    },
  };
}

describe("buildUsdcTransfer", () => {
  it("merges coins, splits the exact amount, transfers to the shop", async () => {
    const c = client([[coin(1, "1000000")], [coin(2, "3000000")]]);
    const tx = await buildUsdcTransfer({ client: c, owner: OWNER, payee: SHOP, amountUsdc: "3.50" });
    const d = tx.getData();
    expect(d.sender).toBe(OWNER);
    const kinds = d.commands.map((x) => x.$kind);
    expect(kinds).toEqual(["MergeCoins", "SplitCoins", "TransferObjects"]);
    expect((c.calls[0] as { coinType?: string }).coinType).toBe(USDC_TYPE);
    expect(c.calls).toHaveLength(2);
    const split = d.commands[1] as { SplitCoins: { amounts: unknown[] } };
    expect(JSON.stringify(split.SplitCoins.amounts)).toBeDefined();
    // amount input is 3.5 USDC = 3500000 micro (u64 pure bytes)
    const pure = d.inputs.filter((i) => i.$kind === "Pure") as { Pure: { bytes: string } }[];
    const u64 = Buffer.from(pure[0].Pure.bytes, "base64");
    expect(u64.readBigUInt64LE(0)).toBe(BigInt(3500000));
  });
  it("uses one coin without merge when it covers the amount", async () => {
    const tx = await buildUsdcTransfer({ client: client([[coin(1, "9000000")]]), owner: OWNER, payee: SHOP, amountUsdc: "4.5" });
    expect(tx.getData().commands.map((x) => x.$kind)).toEqual(["SplitCoins", "TransferObjects"]);
  });
  it("rejects insufficient balance, bad payee, zero", async () => {
    await expect(buildUsdcTransfer({ client: client([[coin(1, "100")]]), owner: OWNER, payee: SHOP, amountUsdc: "1" })).rejects.toThrow(/Not enough/);
    await expect(buildUsdcTransfer({ client: client([[]]), owner: OWNER, payee: "0x12", amountUsdc: "1" })).rejects.toThrow(/valid Sui/);
    await expect(buildUsdcTransfer({ client: client([[coin(1, "100")]]), owner: OWNER, payee: SHOP, amountUsdc: "0" })).rejects.toThrow(/greater/);
  });
  it("selectCoins picks largest first", () => {
    expect(selectCoins([coin(1, "5"), coin(2, "10")], BigInt(8))?.picked).toHaveLength(1);
  });
});
