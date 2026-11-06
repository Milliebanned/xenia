// Checks whether MEMWAL_ACCOUNT_ID is actually a wallet address, and lists any MemWalAccount objects it owns.
import { config } from "dotenv";
import { SuiGrpcClient } from "@mysten/sui/grpc";
config({ path: ".env.local", quiet: true });
const id = process.env.MEMWAL_ACCOUNT_ID!;
for (const network of ["mainnet", "testnet"] as const) {
  const client = new SuiGrpcClient({ network, baseUrl: `https://fullnode.${network}.sui.io:443` });
  try {
    const res = await client.core.listOwnedObjects({ owner: id, limit: 50 });
    const types = res.objects.map((o) => o.type);
    console.log(`${network}: owns ${res.objects.length} object(s)`);
    for (const o of res.objects) if (/account|memwal/i.test(o.type)) console.log(`  CANDIDATE ${o.objectId}  ${o.type}`);
    if (!res.objects.some((o) => /account|memwal/i.test(o.type))) console.log("  types seen:", [...new Set(types)].slice(0, 6).join(" | "));
  } catch (e) {
    console.log(`${network}: ${(e as Error).message.slice(0, 120)}`);
  }
}
