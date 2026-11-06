/** Read-only relayer / chain lookups. All functions take an injectable fetch for tests. */
import { VisitError, type RelayerDelegateKeys } from "./types";

export const DEFAULT_RELAYER_URL = "https://relayer.memory.walrus.xyz";
export const SUI_GRAPHQL_URL = "https://graphql.mainnet.sui.io/graphql";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface RelayerConfig {
  packageId: string;
  registryId: string;
}

function stripSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

export async function fetchRelayerConfig(
  serverUrl: string,
  f: FetchLike = fetch,
): Promise<RelayerConfig> {
  const res = await f(`${stripSlash(serverUrl)}/config`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new VisitError(`relayer /config returned ${res.status}`, "relayer", 502);
  const j = (await res.json()) as Partial<RelayerConfig>;
  if (!j.packageId || !j.registryId) throw new VisitError("relayer /config missing ids", "relayer", 502);
  return { packageId: j.packageId, registryId: j.registryId };
}

/** GET /api/accounts/:owner/delegate-keys. Public, unauthenticated. Public keys are lowercase hex. */
export async function fetchDelegateKeys(
  serverUrl: string,
  ownerAddress: string,
  f: FetchLike = fetch,
): Promise<RelayerDelegateKeys> {
  const res = await f(
    `${stripSlash(serverUrl)}/api/accounts/${encodeURIComponent(ownerAddress)}/delegate-keys`,
    { signal: AbortSignal.timeout(8000), cache: "no-store" },
  );
  if (!res.ok) throw new VisitError(`relayer delegate-keys returned ${res.status}`, "relayer", 502);
  const j = (await res.json()) as RelayerDelegateKeys;
  if (!j || !Array.isArray(j.keys)) throw new VisitError("relayer delegate-keys malformed", "relayer", 502);
  return j;
}

/** Owner address of a MemWalAccount object, read via Sui GraphQL (read-only). */
export async function resolveAccountOwner(
  accountId: string,
  f: FetchLike = fetch,
  graphqlUrl: string = SUI_GRAPHQL_URL,
): Promise<string> {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(accountId)) {
    throw new VisitError("customerAccountId is not a Sui object id", "bad_request", 400);
  }
  const res = await f(graphqlUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `{ object(address:"${accountId}"){ asMoveObject{ contents{ json } } } }`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new VisitError(`sui graphql returned ${res.status}`, "relayer", 502);
  const body = (await res.json()) as {
    data?: { object?: { asMoveObject?: { contents?: { json?: { owner?: string } } } } };
  };
  const owner = body.data?.object?.asMoveObject?.contents?.json?.owner;
  if (!owner) throw new VisitError("could not resolve account owner (not a MemWalAccount?)", "bad_request", 400);
  return owner;
}
