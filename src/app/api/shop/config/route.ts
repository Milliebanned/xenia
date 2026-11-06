import { DEFAULT_RELAYER_URL, fetchRelayerConfig, resolveAccountOwner } from "@/lib/visit/relayer";

/**
 * GET /api/shop/config -> PUBLIC info only (no secrets): shop payee address, demo customer account id,
 * its owner address and the MemWal package/registry ids the wallet needs. Every field is public on-chain data.
 */
type Cached = { at: number; body: Record<string, unknown> };
const g = globalThis as unknown as { __xeniaShopCfg?: Cached };

export async function GET() {
  const c = g.__xeniaShopCfg;
  if (c && Date.now() - c.at < 5 * 60_000) return Response.json(c.body, { headers: { "cache-control": "no-store" } });
  const demoAccountId = process.env.DEMO_CUSTOMER_ACCOUNT_ID || process.env.MEMWAL_ACCOUNT_ID || null;
  const serverUrl = process.env.MEMWAL_SERVER_URL || DEFAULT_RELAYER_URL;
  const [owner, cfg] = await Promise.allSettled([
    demoAccountId ? resolveAccountOwner(demoAccountId) : Promise.reject(new Error("no account")),
    fetchRelayerConfig(serverUrl),
  ]);
  const body = {
    shopAddress: process.env.SHOP_SUI_ADDRESS || null,
    demoAccountId,
    demoOwnerAddress: owner.status === "fulfilled" ? owner.value : null,
    memwal: cfg.status === "fulfilled" ? cfg.value : null,
    network: "mainnet",
  };
  if (owner.status === "fulfilled" && cfg.status === "fulfilled") g.__xeniaShopCfg = { at: Date.now(), body };
  return Response.json(body, { headers: { "cache-control": "no-store" } });
}
