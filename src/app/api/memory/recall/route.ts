import { NextResponse } from "next/server";
import { fail, svc } from "../_util";


/** GET /api/memory/recall?q=...&limit=5&maxDistance=0.5. `stale: true` means served from cache after a timeout. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "missing q" }, { status: 400 });
  const num = (k: string) => (sp.get(k) !== null && Number.isFinite(Number(sp.get(k))) ? Number(sp.get(k)) : undefined);
  try {
    const r = await svc().recallDetailed(q, { limit: num("limit"), maxDistance: num("maxDistance") });
    return NextResponse.json({ results: r.facts, stale: r.stale, error: r.error });
  } catch (e) {
    return fail(e);
  }
}
