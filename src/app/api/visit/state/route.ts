import { visitService } from "@/lib/visit";
import { fail, json } from "../_http";


/** GET ?visitId=... -> VisitState. */
export async function GET(req: Request) {
  try {
    return json(await visitService.getState(new URL(req.url).searchParams.get("visitId") ?? ""));
  } catch (e) {
    return fail(e);
  }
}
