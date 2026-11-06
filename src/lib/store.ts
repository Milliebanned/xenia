/**
 * Tiny JSON-file store under .data/ (server-side only).
 * One file, one in-process mutex (read-modify-write is serialized), atomic writes (tmp + rename).
 * Override the directory with XENIA_DATA_DIR (tests use a temp dir).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { TabEntry } from "./types";

/** What we cache per tx digest: the on-chain facts, not a verdict (the verdict depends on payee/min). */
export interface CachedTx {
  digest: string;
  success: boolean;
  timestampMs: number | null;
  /** Net USDC balance changes in micro-USDC (signed integer strings), keyed by normalized address. */
  usdcChanges: Record<string, string>;
  cachedAt: string;
}

/** A digest that has been applied to a tab. Presence = replay protection. */
export interface SettlementRecord {
  digest: string;
  customerId: string;
  shopId: string;
  paidMicro: string;
  appliedMicro: string;
  unappliedMicro: string;
  settledEntryIds: string[];
  at: string;
}

export interface DbShape {
  tab: TabEntry[];
  settlements: Record<string, SettlementRecord>;
  txCache: Record<string, CachedTx>;
}

function emptyDb(): DbShape {
  return { tab: [], settlements: {}, txCache: {} };
}

function dataDir(): string {
  return process.env.XENIA_DATA_DIR ?? path.join(process.cwd(), ".data");
}
function dbFile(): string {
  return path.join(dataDir(), "xenia.json");
}

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(dbFile(), "utf8");
    return { ...emptyDb(), ...(JSON.parse(raw) as Partial<DbShape>) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return emptyDb();
    throw e;
  }
}

async function save(db: DbShape): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${dbFile()}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, dbFile()); // atomic on the same filesystem
}

/** Run a read-modify-write transaction. Writes only if `fn` did not throw. Serialized in-process. */
export function mutateDb<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const out = await fn(db);
    await save(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Read-only snapshot. */
export function readDb<T>(fn: (db: DbShape) => T): Promise<T> {
  const run = queue.then(async () => fn(await load()));
  queue = run.catch(() => undefined);
  return run;
}
