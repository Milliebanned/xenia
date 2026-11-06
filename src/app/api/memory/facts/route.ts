import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, svc } from "../_util";


const Body = z.object({
  text: z.string().min(1).max(500),
  kind: z.enum(["order", "allergy", "nickname", "preference", "payment_habit"]),
});

/** Save a fact. Returns immediately with status "saving"; poll GET to see "saved" + blobId. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  try {
    const fact = await svc().saveFact(parsed.data.text, parsed.data.kind);
    return NextResponse.json({ fact }, { status: 202 });
  } catch (e) {
    return fail(e);
  }
}

export async function GET() {
  try {
    return NextResponse.json({ facts: svc().listFacts() });
  } catch (e) {
    return fail(e);
  }
}
