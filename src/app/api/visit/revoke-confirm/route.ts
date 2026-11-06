import { visitService } from "@/lib/visit";
import { body, fail, json, str } from "../_http";

export const maxDuration = 300;

/** POST { visitId, digest } -> VisitState with timings (keyRemovedFromListMs, shopRecallDeniedMs, evidence[]). */
export async function POST(req: Request) {
  try {
    const b = await body(req);
    return json(await visitService.confirmRevoke(str(b.visitId), str(b.digest)));
  } catch (e) {
    return fail(e);
  }
}
