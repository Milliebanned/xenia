import { verifyUsdcPayment } from "@/lib/tatum";
import { listOpenTab, openTotalUsdc, settleWithPayment } from "@/lib/tab";


/**
 * POST /api/pay/verify {digest, customerId, shopId, minAmountUsdc?}
 * Payee is ALWAYS the server's SHOP_SUI_ADDRESS (never client-supplied). minAmountUsdc defaults to "0.000001"
 * (any positive payment; partial payments settle the oldest entries first).
 */
export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { digest, customerId, shopId, minAmountUsdc } = body;
  if (!digest || !customerId || !shopId) {
    return Response.json({ error: "digest, customerId and shopId are required" }, { status: 400 });
  }
  const payee = process.env.SHOP_SUI_ADDRESS;
  if (!payee) return Response.json({ error: "server missing SHOP_SUI_ADDRESS" }, { status: 500 });

  const payment = await verifyUsdcPayment({ digest, expectedPayee: payee, minAmountUsdc: minAmountUsdc ?? "0.000001" });
  let settlement = null;
  try {
    settlement = await settleWithPayment(customerId, shopId, payment);
  } catch (e) {
    return Response.json({ error: (e as Error).message, payment }, { status: 400 });
  }
  const tab = await listOpenTab(customerId, shopId);
  return Response.json({ payment, settlement, tab, openTotalUsdc: openTotalUsdc(tab) });
}
