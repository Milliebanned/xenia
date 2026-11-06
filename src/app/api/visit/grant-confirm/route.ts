import { visitService } from "@/lib/visit";
import { body, fail, json, str } from "../_http";

export const maxDuration = 120;

/** POST { visitId, digest } -> VisitState. Polls the relayer until the key is listed (<= 60s). */
export async function POST(req: Request) {
  try {
    const b = await body(req);
    return json(await visitService.confirmGrant(str(b.visitId), str(b.digest)));
  } catch (e) {
    return fail(e);
  }
}
