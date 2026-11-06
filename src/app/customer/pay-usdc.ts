/**
 * Native-USDC transfer on Sui mainnet, built for the USER'S browser wallet to sign.
 * Pure transaction construction (no signing here); the coin lookup client is injected so it is unit-testable.
 */
import { Transaction } from "@mysten/sui/transactions";
import { parseUsdc } from "@/lib/tab/money";

export const USDC_TYPE = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
const SUI_ADDR = /^0x[0-9a-fA-F]{64}$/;

export interface CoinLister {
  listCoins(o: { owner: string; coinType?: string; limit?: number; cursor?: string | null }): Promise<{
    objects: { objectId: string; balance: string }[];
    hasNextPage: boolean;
    cursor: string | null;
  }>;
}

/** Coin selection: largest-first until the amount is covered. Returns null if the owner cannot cover it. */
export function selectCoins(coins: { objectId: string; balance: string }[], need: bigint) {
  const sorted = [...coins].sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : BigInt(b.balance) < BigInt(a.balance) ? -1 : 0));
  const picked: typeof coins = [];
  let sum = BigInt(0);
  for (const c of sorted) {
    if (sum >= need) break;
    picked.push(c);
    sum += BigInt(c.balance);
  }
  return sum >= need ? { picked, sum } : null;
}

export async function buildUsdcTransfer(o: {
  client: CoinLister;
  owner: string;
  payee: string;
  amountUsdc: string;
}): Promise<Transaction> {
  if (!SUI_ADDR.test(o.payee)) throw new Error("Shop payment address is not a valid Sui address");
  if (!SUI_ADDR.test(o.owner)) throw new Error("Wallet address is not a valid Sui address");
  const amount = parseUsdc(o.amountUsdc);
  if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
  const all: { objectId: string; balance: string }[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const r = await o.client.listCoins({ owner: o.owner, coinType: USDC_TYPE, cursor });
    all.push(...r.objects);
    if (!r.hasNextPage) break;
    cursor = r.cursor;
  }
  const sel = selectCoins(all, amount);
  if (!sel) throw new Error(`Not enough USDC in this wallet to pay ${o.amountUsdc} USDC`);
  const tx = new Transaction();
  tx.setSender(o.owner);
  const [first, ...rest] = sel.picked.slice(0, 100);
  const primary = tx.object(first.objectId);
  if (rest.length) tx.mergeCoins(primary, rest.map((c) => tx.object(c.objectId)));
  const [payment] = tx.splitCoins(primary, [tx.pure.u64(amount)]);
  tx.transferObjects([payment], tx.pure.address(o.payee));
  return tx;
}
