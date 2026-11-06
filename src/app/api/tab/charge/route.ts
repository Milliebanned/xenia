import { addCharge, listOpenTab, openTotalUsdc } from "@/lib/tab";


/** POST /api/tab/charge {customerId, shopId, amountUsdc, note?} -> {entry, openTotalUsdc} */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { customerId, shopId, amountUsdc, note } = body as Record<string, string>;
  try {
    const entry = await addCharge(customerId, shopId, amountUsdc, typeof note === "string" ? note : undefined);
    return Response.json({ entry, openTotalUsdc: openTotalUsdc(await listOpenTab(customerId, shopId)) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
