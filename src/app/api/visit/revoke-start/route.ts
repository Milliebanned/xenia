import { visitService } from "@/lib/visit";
import { body, fail, json, str } from "../_http";


/** POST { visitId } -> RevokeStartResult (walletAction = what the owner wallet signs; status "revoking"). */
export async function POST(req: Request) {
  try {
    const b = await body(req);
    return json(await visitService.startRevoke(str(b.visitId)));
  } catch (e) {
    return fail(e);
  }
}
