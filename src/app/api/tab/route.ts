import { listHistory, listOpenTab, openTotalUsdc } from "@/lib/tab";


/** GET /api/tab?customerId=&shopId=[&history=1] -> {open, openTotalUsdc, history?} */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const customerId = u.searchParams.get("customerId") ?? "";
  const shopId = u.searchParams.get("shopId") ?? "";
  if (!customerId || !shopId) return Response.json({ error: "customerId and shopId are required" }, { status: 400 });
  const open = await listOpenTab(customerId, shopId);
  return Response.json({
    open,
    openTotalUsdc: openTotalUsdc(open),
    ...(u.searchParams.get("history") ? { history: await listHistory(customerId, shopId) } : {}),
  });
}
