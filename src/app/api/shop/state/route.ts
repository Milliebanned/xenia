import type { RecalledFact, Suggestion } from "@/lib/types";
import { visitService } from "@/lib/visit";
import { listOpenTab, openTotalUsdc } from "@/lib/tab";
import { getMemoryService } from "@/lib/memory";
import { fail, json } from "../../visit/_http";

export const maxDuration = 60;

/** Queries phrased like the stored memories ("[date] Usual order: ..."). */
// Verified on mainnet data: bare labels ("Usual order: ") miss the 0.5 cutoff; a few descriptive words land at 0.35-0.42.
// Only the coffee phrasing is verified against real stored data (0.35); the others are neutral phrasings for other kinds of business
// and are UNVERIFIED on mainnet until non-coffee facts are stored. Results are merged by blob id, so extra queries are harmless.
const QUERIES = [
  "Usual order: coffee drink",
  "Usual order: haircut, groceries or prescription",
  "Allergy: severe food allergy",
  "Allergy: medication or latex allergy",
  "Nickname: goes by the nickname",
];
const TTL_MS = 20_000;

interface Snap {
  at: number;
  facts: RecalledFact[];
  rejected: boolean;
  error?: string;
}
const g = globalThis as unknown as { __xeniaShopSnap?: Map<string, Snap>; __xeniaShopSugg?: { at: number; v: Suggestion[] } };
const snaps = (g.__xeniaShopSnap ??= new Map());

/**
 * GET ?visitId= -> { visit: VisitState, facts, recallRejected, recallError?, tab, openTotalUsdc, suggestions }.
 * Read-only. Facts are recalled with the shop's per-visit key (profile namespace), only while the visit is
 * active, cached for 20s to respect the relayer rate limit. Never includes any private key.
 */
export async function GET(req: Request) {
  try {
    const visitId = new URL(req.url).searchParams.get("visitId") ?? "";
    const visit = await visitService.getState(visitId);
    const s = visit.session;
    let facts: RecalledFact[] = [];
    let recallRejected = false;
    let recallError: string | undefined;
    if (s.status === "active") {
      let snap = snaps.get(visitId);
      if (!snap || Date.now() - snap.at > TTL_MS) {
        try {
          const rs = await Promise.all(QUERIES.map((q) => visitService.recallAsShop(visitId, q, { limit: 5 })));
          const seen = new Map<string, RecalledFact>();
          for (const r of rs) for (const f of r.facts) seen.set(f.blobId, f);
          snap = { at: Date.now(), facts: [...seen.values()].sort((a, b) => a.distance - b.distance), rejected: false };
        } catch (e) {
          const x = e as { status?: number; serverCode?: string; message?: string };
          const rejected = x.status === 401 || x.status === 403 || x.serverCode === "AUTH_REJECTED";
          snap = { at: Date.now(), facts: [], rejected, error: rejected ? undefined : (x.message ?? "recall failed").slice(0, 200) };
        }
        snaps.set(visitId, snap);
      }
      facts = snap.facts;
      recallRejected = snap.rejected;
      recallError = snap.error;
    } else {
      snaps.delete(visitId);
    }
    const open = await listOpenTab(s.customerAccountId, s.shopId);
    let suggestions: Suggestion[] = [];
    if (s.status === "active") {
      const c = g.__xeniaShopSugg;
      if (c && Date.now() - c.at < 30_000) suggestions = c.v;
      else {
        try {
          suggestions = await getMemoryService().suggestionsForVisit();
          g.__xeniaShopSugg = { at: Date.now(), v: suggestions };
        } catch {
          suggestions = [];
        }
      }
    }
    return json({ visit, facts, recallRejected, recallError, tab: open, openTotalUsdc: openTotalUsdc(open), suggestions });
  } catch (e) {
    return fail(e);
  }
}
