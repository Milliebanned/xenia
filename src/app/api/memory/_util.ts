import { NextResponse } from "next/server";
import { getMemoryService } from "@/lib/memory";

export function svc() {
  return getMemoryService();
}

export function fail(e: unknown, status = 500) {
  return NextResponse.json({ error: (e as Error).message ?? "error" }, { status });
}
