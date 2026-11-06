import { visitService } from "@/lib/visit";
import { body, fail, json, str } from "../_http";


/** POST { shopId, customerAccountId, ownerAddress? } -> CreateVisitResult (status "pending"). */
export async function POST(req: Request) {
  try {
    const b = await body(req);
    return json(
      await visitService.createVisit({
        shopId: str(b.shopId),
        customerAccountId: str(b.customerAccountId),
        ownerAddress: str(b.ownerAddress) || undefined,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}
