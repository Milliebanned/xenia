/**
 * Visit persistence. Records (including the shop's per-visit PRIVATE key) live ONLY server-side
 * in .data/visits.json (gitignored). Nothing here is ever serialized to an API response directly.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { VisitSession } from "@/lib/types";
import type { VisitTimings } from "./types";

export interface VisitRecord {
  session: VisitSession;
  ownerAddress: string;
  /** SECRET: hex Ed25519 private key of the shop's per-visit delegate key. */
  delegatePrivateKey: string;
  timings: VisitTimings;
  lastError?: string;
}

export interface VisitStore {
  get(id: string): Promise<VisitRecord | undefined>;
  put(rec: VisitRecord): Promise<void>;
}

export class MemoryVisitStore implements VisitStore {
  private m = new Map<string, VisitRecord>();
  async get(id: string) {
    const r = this.m.get(id);
    return r ? structuredClone(r) : undefined;
  }
  async put(rec: VisitRecord) {
    this.m.set(rec.session.id, structuredClone(rec));
  }
}

/** JSON file store. Re-reads on every get so separate route bundles share state. */
export class FileVisitStore implements VisitStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private file = path.join(process.cwd(), ".data", "visits.json")) {}

  private async readAll(): Promise<Record<string, VisitRecord>> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as Record<string, VisitRecord>;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw e;
    }
  }

  async get(id: string) {
    await this.queue.catch(() => undefined);
    return (await this.readAll())[id];
  }

  put(rec: VisitRecord): Promise<void> {
    const run = async () => {
      const all = await this.readAll();
      all[rec.session.id] = rec;
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(all, null, 2), { mode: 0o600 });
      await fs.rename(tmp, this.file);
    };
    const p = this.queue.catch(() => undefined).then(run);
    this.queue = p;
    return p;
  }
}
