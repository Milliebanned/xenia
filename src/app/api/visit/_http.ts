import type { VisitError } from "@/lib/visit/types";

/** Shared JSON helpers for visit routes. Errors never include stack traces or secrets. */
export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function fail(e: unknown): Response {
  // Duck-typed (not instanceof) so it survives duplicated module instances in dev/HMR.
  if ((e as Error)?.name === "VisitError") {
    const v = e as VisitError;
    return json({ error: v.message, code: v.code }, v.httpStatus);
  }
  const x = e as { status?: number; message?: string };
  // SDK errors (e.g. relayer 401) carry .status; surface it, message is already sanitized by the SDK.
  const status = x?.status && x.status >= 400 && x.status < 600 ? x.status : 500;
  return json({ error: x?.message?.slice(0, 300) ?? "internal error", code: "upstream" }, status);
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown): string => (typeof v === "string" ? v : "");
