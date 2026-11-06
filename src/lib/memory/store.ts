import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ProfileFact, RecalledFact } from "../types";

export interface StoreData {
  facts: ProfileFact[];
  recallCache: Record<string, RecalledFact[]>;
}

/** Tiny JSON persistence so a server restart keeps blob IDs (proof for judges). null path = memory only. */
export class JsonStore {
  data: StoreData = { facts: [], recallCache: {} };
  constructor(private path: string | null = resolve(process.cwd(), ".data/memory.json")) {
    if (path && existsSync(path)) {
      try {
        const d = JSON.parse(readFileSync(path, "utf8")) as Partial<StoreData>;
        this.data = { facts: d.facts ?? [], recallCache: d.recallCache ?? {} };
      } catch {
        // corrupt file: start fresh rather than crash the server
      }
    }
  }
  save(): void {
    if (!this.path) return;
    try {
      mkdirSync(dirname(this.path), { recursive: true });
      const tmp = `${this.path}.tmp`;
      writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      renameSync(tmp, this.path);
    } catch {
      // persistence is best-effort; in-memory state stays authoritative
    }
  }
}
