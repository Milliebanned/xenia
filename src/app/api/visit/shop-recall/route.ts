import { visitService } from "@/lib/visit";
import { body, fail, json, str } from "../_http";

export const maxDuration = 60;

/** POST { visitId, query } -> { visitId, facts: RecalledFact[] }. Shop's per-visit key, profile facts only. */
export async function POST(req: Request) {
  try {
    const b = await body(req);
    return json(await visitService.recallAsShop(str(b.visitId), str(b.query)));
  } catch (e) {
    return fail(e);
  }
}
