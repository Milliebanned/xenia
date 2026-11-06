import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, svc } from "../_util";


const Body = z.object({ text: z.string().min(1).max(2000) });

/** Free text -> facts (Walrus analyze). Facts come back with status "saving"; poll GET /api/memory/facts. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  try {
    return NextResponse.json({ facts: await svc().learnFromText(parsed.data.text) }, { status: 202 });
  } catch (e) {
    return fail(e, 502);
  }
}
