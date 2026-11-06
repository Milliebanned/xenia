import { getBalances, resolveName } from "@/lib/tatum";


/** GET /api/pay/balances?address= -> {address, name, balances} */
export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address") ?? "";
  try {
    const [balances, name] = await Promise.all([getBalances(address), resolveName(address)]);
    return Response.json({ address, name, balances });
  } catch (e) {
    const msg = (e as Error).message;
    return Response.json({ error: msg }, { status: /invalid/.test(msg) ? 400 : 502 });
  }
}
