/**
 * Default wired visit service for API routes (real relayer, real MemWal, file store in .data/).
 * Server-only: never import this from client components. Client code may import ./qr and ./types.
 */
import { randomUUID } from "node:crypto";
import { MemWal } from "@mysten-incubation/memwal";
import { generateDelegateKey } from "@mysten-incubation/memwal/account";
import { createVisitService, type VisitService } from "./service";
import { FileVisitStore } from "./store";
import { DEFAULT_RELAYER_URL, fetchDelegateKeys, fetchRelayerConfig, resolveAccountOwner } from "./relayer";

function toHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

function build(): VisitService {
  const serverUrl = process.env.MEMWAL_SERVER_URL || DEFAULT_RELAYER_URL;
  let cfg: Promise<{ packageId: string; registryId: string }> | undefined;
  return createVisitService({
    store: new FileVisitStore(),
    serverUrl,
    // Namespace holding SHAREABLE profile facts. Override with VISIT_PROFILE_NAMESPACE.
    profileNamespace: process.env.VISIT_PROFILE_NAMESPACE || process.env.MEMWAL_NAMESPACE || "xenia-profile",
    getConfig: () => (cfg ??= fetchRelayerConfig(serverUrl).catch((e) => ((cfg = undefined), Promise.reject(e)))),
    fetchDelegateKeys: (owner) => fetchDelegateKeys(serverUrl, owner),
    resolveOwner: (id) => resolveAccountOwner(id),
    generateKey: async () => {
      const k = await generateDelegateKey();
      return { privateKey: k.privateKey, publicKeyHex: toHex(k.publicKey) };
    },
    createMemwal: (o) =>
      MemWal.create({ key: o.key, accountId: o.accountId, serverUrl: o.serverUrl, namespace: o.namespace }),
    now: () => Date.now(),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    newId: () => randomUUID(),
    log: (l) => console.info(l),
  });
}

// Survive Next dev module reloads so per-visit MemWal clients are reused.
const g = globalThis as unknown as { __xeniaVisit?: VisitService };
export const visitService: VisitService = (g.__xeniaVisit ??= build());

export { createVisitService, toPublicState, isAuthRejection } from "./service";
export type { VisitService, VisitDeps } from "./service";
export { encodeQrPayload, parseQrPayload } from "./qr";
export * from "./types";
