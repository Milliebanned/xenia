/**
 * Tatum Sui gRPC client (server-side only). Native gRPC transport + x-api-key header,
 * wrapped by SuiGrpcClient. Adds a rate limiter (free plan: 3 req/s) and retry-with-backoff on 429.
 */
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import { ChannelCredentials } from "@grpc/grpc-js";

export const TATUM_GRPC_HOST = "sui-mainnet-grpc.gateway.tatum.io:443";
export const USDC_COIN_TYPE =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

/** The slice of SuiGrpcClient we use (lets tests inject a mock). */
export interface TatumLike {
  core: Pick<SuiGrpcClient["core"], "getTransaction" | "listBalances">;
  nameService?: Pick<SuiGrpcClient["nameService"], "reverseLookupName">;
}

let client: TatumLike | undefined;

export function getTatumClient(): TatumLike {
  if (client) return client;
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) throw new Error("TATUM_API_KEY is not set");
  const transport = new GrpcTransport({
    host: TATUM_GRPC_HOST,
    channelCredentials: ChannelCredentials.createSsl(),
    meta: { "x-api-key": apiKey },
  });
  client = new SuiGrpcClient({ network: "mainnet", transport });
  return client;
}

/** Test hook: inject (or clear) a client. */
export function setTatumClientForTests(c: TatumLike | undefined): void {
  client = c;
}

// ---- rate limiter: serialize call starts, at least minIntervalMs apart (3/s => 340ms leaves headroom) ----
const cfg = { minIntervalMs: 340, maxRetries: 4, baseBackoffMs: 500 };
let nextSlot = 0;

/** Test hook: shrink delays. */
export function configureTatumLimits(p: Partial<typeof cfg>): void {
  Object.assign(cfg, p);
  nextSlot = 0;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function takeSlot(): Promise<void> {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + cfg.minIntervalMs;
  if (at > now) await sleep(at - now);
}

/** Observed shape: 429 arrives as RpcError{code:"UNAVAILABLE", message:"Received HTTP status code 429"}. */
export function isRateLimited(e: unknown): boolean {
  const x = e as { code?: string; message?: string } | undefined;
  return !!x && (/\b429\b/.test(x.message ?? "") || x.code === "RESOURCE_EXHAUSTED");
}

/**
 * Observed shape: unknown digest => TransactionError("Transaction <digest> not found") from the SDK
 * (gRPC NOT_FOUND mapped by SuiGrpcClient); name lookups throw RpcError code NOT_FOUND.
 */
export function isNotFound(e: unknown): boolean {
  const x = e as { code?: string; message?: string } | undefined;
  return !!x && (x.code === "NOT_FOUND" || /not found/i.test(x.message ?? ""));
}

/** Run a Tatum call through the limiter, retrying 429 (and transient UNAVAILABLE) with exponential backoff. */
export async function tatumCall<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  for (;;) {
    await takeSlot();
    try {
      return await fn();
    } catch (e) {
      if (!isRateLimited(e) || attempt >= cfg.maxRetries) throw e;
      await sleep(cfg.baseBackoffMs * 2 ** attempt);
      attempt++;
    }
  }
}
