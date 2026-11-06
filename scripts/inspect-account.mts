// Reads the MemWalAccount object on Sui mainnet via Tatum and checks whether our delegate public key is registered.
import { config } from "dotenv";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import { ChannelCredentials } from "@grpc/grpc-js";
config({ path: ".env.local", quiet: true });
const transport = new GrpcTransport({
  host: "sui-mainnet-grpc.gateway.tatum.io:443",
  channelCredentials: ChannelCredentials.createSsl(),
  meta: { "x-api-key": process.env.TATUM_API_KEY! },
});
const client = new SuiGrpcClient({ network: "mainnet", transport });
const id = process.env.MEMWAL_ACCOUNT_ID!;
const agent = (process.env.MEMWAL_AGENT_ID ?? "").replace(/^0x/, "").toLowerCase();
const { object } = await client.core.getObject({ objectId: id, include: { json: true } });
console.log("type:", object.type);
console.log("owner:", JSON.stringify(object.owner));
const json = JSON.stringify(object.json ?? {});
console.log("json (truncated):", json.slice(0, 700));
console.log("contains our public key:", json.toLowerCase().includes(agent));
