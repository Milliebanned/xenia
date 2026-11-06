// Read-only live check of the visit layer against mainnet: relayer /config, Sui GraphQL owner lookup,
// relayer delegate-keys list, a real generateDelegateKey, and a real unauthorised recall (expects 401).
// Writes nothing on-chain or to Walrus. Run: npx tsx scripts/visit-readonly-check.mts
import { config } from "dotenv";
import { MemWal } from "@mysten-incubation/memwal";
import { generateDelegateKey } from "@mysten-incubation/memwal/account";
import { createVisitService, isAuthRejection } from "../src/lib/visit/service";
import { MemoryVisitStore } from "../src/lib/visit/store";
import { DEFAULT_RELAYER_URL, fetchDelegateKeys, fetchRelayerConfig, resolveAccountOwner } from "../src/lib/visit/relayer";
config({ path: ".env.local", quiet: true });

const accountId = process.env.MEMWAL_ACCOUNT_ID!;
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const svc = createVisitService({
  store: new MemoryVisitStore(),
  serverUrl: DEFAULT_RELAYER_URL,
  profileNamespace: "default",
  getConfig: () => fetchRelayerConfig(DEFAULT_RELAYER_URL),
  fetchDelegateKeys: (o) => fetchDelegateKeys(DEFAULT_RELAYER_URL, o),
  resolveOwner: (id) => resolveAccountOwner(id),
  generateKey: async () => { const k = await generateDelegateKey(); return { privateKey: k.privateKey, publicKeyHex: hex(k.publicKey) }; },
  createMemwal: (o) => MemWal.create(o),
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  newId: () => "readonly-check",
  log: (l) => console.log(l),
});
const v = await svc.createVisit({ shopId: "check", customerAccountId: accountId });
console.log("create ->", v.session.status, "owner", v.ownerAddress.slice(0, 10) + "..", "pkg", v.walletAction.packageId.slice(0, 10) + "..", "pub", v.qr.publicKey.slice(0, 8) + "..");
const g = await svc.confirmGrant(v.session.id, "FAKE", { timeoutMs: 3000, intervalMs: 1000 });
console.log("grant-confirm for never-registered key ->", g.session.status, g.lastError);
// Unregistered key => shop recall must be rejected (this is what revoke-confirm waits for).
const m = MemWal.create({ key: (await generateDelegateKey()).privateKey, accountId, serverUrl: DEFAULT_RELAYER_URL });
try { await m.recall({ query: "x", limit: 1 }); console.log("UNEXPECTED: recall accepted"); }
catch (e) { console.log("unregistered key recall -> isAuthRejection:", isAuthRejection(e), (e as { status?: number }).status); }
m.destroy();
