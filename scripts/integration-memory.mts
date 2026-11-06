/**
 * REAL mainnet integration for the memory engine. At most 3 writes per run.
 * Run once:  npx tsx scripts/integration-memory.mts
 * Reads MEMWAL_* from .env.local (never printed). Persists status to .data/memory.json.
 */
import { config } from "dotenv";
import { createMemWalFromEnv } from "../src/lib/memory/index";
import { XeniaMemory } from "../src/lib/memory/service";

config({ path: ".env.local" });

const SAMPLE: [string, "nickname" | "order" | "allergy"][] = [
  ["Goes by the nickname Mari.", "nickname"],
  ["flat white, oat milk, extra hot.", "order"],
  ["tree nuts (severe, no almond milk or pistachio syrup).", "allergy"],
];

async function main() {
  const svc = new XeniaMemory(createMemWalFromEnv(), { recallTimeoutMs: 20_000 });
  svc.resumePending();

  const t0 = Date.now();
  for (const [text, kind] of SAMPLE) {
    const f = await svc.saveFact(text, kind);
    console.log(`queued  [${f.status}] ${f.text}`);
  }
  console.log("waiting for Walrus writes (~30 s each, in background)...");
  await svc.idle();
  for (const f of svc.listFacts()) console.log(`${f.status.padEnd(7)} blobId=${f.blobId ?? "-"} ${f.error ?? ""} :: ${f.text}`);
  console.log(`writes done in ${Math.round((Date.now() - t0) / 1000)} s`);

  console.log("\nrecall('Usual order: flat white, oat milk')");
  for (let i = 0; i < 4; i++) {
    const r = await svc.recallDetailed("Usual order: the drink and food the customer usually orders", { limit: 5, maxDistance: 0.55 });
    console.log(` attempt ${i + 1}: stale=${r.stale} ${r.error ?? ""}`);
    for (const m of r.facts) console.log(`  d=${m.distance.toFixed(3)} ${m.blobId} ${m.text}`);
    if (r.facts.length && !r.stale) break;
    await new Promise((res) => setTimeout(res, 5000));
  }

  console.log("\nsuggestionsForVisit()");
  for (const s of await svc.suggestionsForVisit()) {
    console.log(`- (${s.kind}) ${s.headline}`);
    for (const b of s.because) console.log(`    because: ${b.blobId} "${b.text}" d=${b.distance.toFixed(3)}`);
  }
}

main().catch((e) => {
  console.error("FAILED:", (e as Error).message);
  process.exit(1);
});
