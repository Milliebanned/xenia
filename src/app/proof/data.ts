/**
 * Read-only evidence loader for /proof. Reads the local stores under .data/ and returns ONLY
 * explicitly whitelisted, non-secret fields. visits.json contains a per-visit private key
 * (delegatePrivateKey): it is never copied out of the parsed record.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const dir = () => process.env.XENIA_DATA_DIR ?? path.join(process.cwd(), ".data");

async function readJson(name: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(path.join(dir(), name), "utf8"));
  } catch {
    return null;
  }
}

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const num = (v: unknown): number | undefined | null => (typeof v === "number" ? v : v === null ? null : undefined);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export interface MemoryRow {
  text: string;
  kind: string;
  createdAt: string;
  status: string;
  blobId?: string;
}
export interface PaymentRow {
  digest: string;
  paidUsdc: string;
  settledAt: string;
  customerId: string;
  shopId: string;
  onChainSuccess?: boolean;
  chainTimeMs?: number | null;
}
export interface VisitRow {
  id: string;
  shopId: string;
  status: string;
  grantedAt: string;
  revokedAt?: string;
  grantDigest?: string;
  revokeDigest?: string;
  grantListedMs?: number | null;
  keyRemovedFromListMs?: number | null;
  shopRecallDeniedMs?: number | null;
  recallProbes?: number;
  evidence: string[];
}
export interface Evidence {
  memories: MemoryRow[];
  payments: PaymentRow[];
  verifiedTxCount: number;
  visits: VisitRow[];
}

function micro(v: string): string {
  try {
    const b = BigInt(v);
    return `${b / BigInt(1_000_000)}.${(b % BigInt(1_000_000)).toString().padStart(6, "0").replace(/0{1,4}$/, "")}`;
  } catch {
    return "?";
  }
}

export async function loadEvidence(): Promise<Evidence> {
  const [mem, db, visits] = await Promise.all([
    readJson("memory.json"),
    readJson("xenia.json"),
    readJson("visits.json"),
  ]);

  const seen = new Set<string>();
  const memories: MemoryRow[] = [];
  for (const f of (Array.isArray(obj(mem).facts) ? (obj(mem).facts as unknown[]) : [])) {
    const o = obj(f);
    const blobId = str(o.blobId);
    if (blobId) {
      if (seen.has(blobId)) continue;
      seen.add(blobId);
    }
    memories.push({
      text: str(o.text) ?? "",
      kind: str(o.kind) ?? "",
      createdAt: str(o.createdAt) ?? "",
      status: str(o.status) ?? "",
      blobId,
    });
  }

  const dbo = obj(db);
  const cache = obj(dbo.txCache);
  const payments: PaymentRow[] = Object.values(obj(dbo.settlements)).map((s) => {
    const o = obj(s);
    const digest = str(o.digest) ?? "";
    const c = obj(cache[digest]);
    return {
      digest,
      paidUsdc: micro(str(o.paidMicro) ?? "0"),
      settledAt: str(o.at) ?? "",
      customerId: str(o.customerId) ?? "",
      shopId: str(o.shopId) ?? "",
      onChainSuccess: typeof c.success === "boolean" ? c.success : undefined,
      chainTimeMs: num(c.timestampMs),
    };
  });

  const visitRows: VisitRow[] = Object.values(obj(visits)).map((r) => {
    const rec = obj(r);
    const s = obj(rec.session);
    const t = obj(rec.timings);
    return {
      id: str(s.id) ?? "",
      shopId: str(s.shopId) ?? "",
      status: str(s.status) ?? "",
      grantedAt: str(s.grantedAt) ?? "",
      revokedAt: str(s.revokedAt),
      grantDigest: str(s.grantDigest),
      revokeDigest: str(s.revokeDigest),
      grantListedMs: num(t.grantListedMs),
      keyRemovedFromListMs: num(t.keyRemovedFromListMs),
      shopRecallDeniedMs: num(t.shopRecallDeniedMs),
      recallProbes: num(t.recallProbes) ?? undefined,
      evidence: Array.isArray(t.evidence) ? t.evidence.filter((e): e is string => typeof e === "string") : [],
    };
  });

  return { memories, payments, verifiedTxCount: Object.keys(cache).length, visits: visitRows };
}
