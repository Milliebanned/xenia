import { config } from "dotenv";
import { MemWal, delegateKeyToPublicKey, delegateKeyToSuiAddress } from "@mysten-incubation/memwal";
config({ path: ".env.local", quiet: true });
const k = process.env.MEMWAL_PRIVATE_KEY ?? "";
const acc = process.env.MEMWAL_ACCOUNT_ID ?? "";
const agent = process.env.MEMWAL_AGENT_ID ?? "";
const kind = k.startsWith("suiprivkey") ? "bech32 suiprivkey" : /^(0x)?[0-9a-fA-F]{64}$/.test(k) ? "64-hex" : `other(len ${k.length})`;
console.log("private key format:", kind);
console.log("account id format:", /^0x[0-9a-fA-F]{64}$/.test(acc) ? "ok 0x+64hex" : `suspicious (len ${acc.length}, starts ${acc.slice(0,4)})`);
console.log("agent id format:", /^(0x)?[0-9a-fA-F]{64}$/.test(agent) ? "ok 64hex" : `suspicious (len ${agent.length})`);
try {
  const hex = k.replace(/^0x/, "");
  const pub = await delegateKeyToPublicKey(hex);
  const pubHex = Buffer.from(pub as Uint8Array).toString("hex");
  const a = agent.replace(/^0x/, "").toLowerCase();
  console.log("derived pubkey matches MEMWAL_AGENT_ID:", pubHex.toLowerCase() === a);
  console.log("derived pubkey (first 8):", pubHex.slice(0, 8), "| agent id (first 8):", a.slice(0, 8));
  console.log("derived delegate sui address (first 10):", (await delegateKeyToSuiAddress(hex)).slice(0, 10));
} catch (e) { console.log("derive failed:", (e as Error).message); }
console.log("account id == shop address?", acc === process.env.SHOP_SUI_ADDRESS);
console.log("server:", process.env.MEMWAL_SERVER_URL);
