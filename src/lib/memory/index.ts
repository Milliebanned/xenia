/** Server-side only. Reads MEMWAL_* env vars; the delegate private key must never reach the browser. */
import { MemWal } from "@mysten-incubation/memwal";
import { XeniaMemory, type MemWalLike, type MemoryOptions } from "./service";

export * from "./learning";
export * from "./limiter";
export { JsonStore } from "./store";
export { XeniaMemory, type MemWalLike, type MemoryOptions, type RecallDetail } from "./service";

export function createMemWalFromEnv(): MemWalLike {
  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  if (!key || !accountId) throw new Error("MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID are not set");
  return MemWal.create({
    key,
    accountId,
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
    namespace: process.env.MEMWAL_NAMESPACE ?? "xenia-profile",
  });
}

const g = globalThis as unknown as { __xeniaMemory?: XeniaMemory };

/** Process-wide singleton (survives Next dev hot reloads). */
export function getMemoryService(opts?: MemoryOptions): XeniaMemory {
  if (!g.__xeniaMemory) {
    g.__xeniaMemory = new XeniaMemory(createMemWalFromEnv(), opts);
    g.__xeniaMemory.resumePending();
  }
  return g.__xeniaMemory;
}
