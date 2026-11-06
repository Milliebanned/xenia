/**
 * Day 1 spike: prove the three things Xenia depends on, with real mainnet calls.
 *   1. Tatum Sui gRPC read works with our API key.
 *   2. Walrus Memory write + recall works on mainnet with our delegate key.
 *   3. (manual follow-up) delegate grant/revoke behaviour at the relayer.
 *
 * Run:  npx tsx scripts/day1-spike.ts
 * Each step reports PASS/FAIL independently so one failure doesn't hide the others.
 */
import { config } from "dotenv";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { MemWal } from "@mysten-incubation/memwal";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import { ChannelCredentials } from "@grpc/grpc-js";

config({ path: ".env.local" });

const TATUM_GRPC_HOST = "sui-mainnet-grpc.gateway.tatum.io:443";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (see .env.example)`);
  return v;
}

async function step<T>(name: string, fn: () => Promise<T>): Promise<T | undefined> {
  const t0 = Date.now();
  try {
    const out = await fn();
    console.log(`PASS  ${name}  (${Date.now() - t0} ms)`);
    return out;
  } catch (e) {
    console.log(`FAIL  ${name}  (${Date.now() - t0} ms)\n      ${(e as Error).message}`);
    return undefined;
  }
}

async function main() {
  // 1) Tatum gRPC: latest checkpoint + balances of the shop address
  await step("Tatum gRPC: latest checkpoint", async () => {
    // Tatum serves native gRPC (HTTP/2), not grpc-web, so use the grpc-js transport.
    const apiKey = need("TATUM_API_KEY");
    const transport = new GrpcTransport({
      host: TATUM_GRPC_HOST,
      channelCredentials: ChannelCredentials.createSsl(),
      meta: { "x-api-key": apiKey },
    });
    const client = new SuiGrpcClient({ network: "mainnet", transport });
    const res = await client.core.getCurrentSystemState();
    console.log("      epoch:", res.systemState.epoch, "protocol:", res.systemState.protocolVersion);
    if (process.env.SHOP_SUI_ADDRESS) {
      const bal = await client.core.listBalances({ owner: process.env.SHOP_SUI_ADDRESS });
      console.log("      shop balances:", JSON.stringify(bal.balances ?? bal, null, 0).slice(0, 300));
    }
  });

  // 2) Walrus Memory: health, write, recall
  if (!process.env.MEMWAL_PRIVATE_KEY || !process.env.MEMWAL_ACCOUNT_ID) {
    console.log("SKIP  Walrus Memory steps: MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID not set in .env.local");
    return;
  }
  const memwal = MemWal.create({
    key: process.env.MEMWAL_PRIVATE_KEY,
    accountId: process.env.MEMWAL_ACCOUNT_ID,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
    namespace: process.env.MEMWAL_NAMESPACE ?? "xenia-profile",
  });

  await step("Walrus Memory: relayer health", async () => {
    console.log("      ", JSON.stringify(await memwal.health()));
  });

  const marker = `xenia-spike-${Date.now()}`;
  const written = await step("Walrus Memory: rememberAndWait (mainnet write)", async () => {
    return memwal.rememberAndWait(
      `[${marker}] Customer usual order: flat white, oat milk. Allergy: tree nuts.`,
      undefined,
      { timeoutMs: 60_000 },
    );
  });
  if (written) console.log("      blob_id:", written.blob_id);

  await step("Walrus Memory: recall", async () => {
    const r = await memwal.recall({ query: "what is the customer's usual order?", limit: 5 });
    const hit = r.results.find((m) => m.text.includes(marker));
    if (!hit) throw new Error(`written memory not recalled yet (indexing lag?) results=${r.total}`);
    console.log("      recalled:", hit.text, `distance=${hit.distance.toFixed(3)}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
