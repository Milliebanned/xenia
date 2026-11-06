import { NextResponse } from "next/server";
import { fail, svc } from "../_util";


export async function GET() {
  try {
    return NextResponse.json({ suggestions: await svc().suggestionsForVisit() });
  } catch (e) {
    return fail(e);
  }
}
