/** QR payload helpers: JSON of {shopId, visitId, publicKey, accountId}. Safe for client and server. */
import type { VisitQrPayload } from "./types";

const HEX64 = /^[0-9a-f]{64}$/;
const SUI_ID = /^0x[0-9a-fA-F]{1,64}$/;

export function encodeQrPayload(p: VisitQrPayload): string {
  return JSON.stringify({
    shopId: p.shopId,
    visitId: p.visitId,
    publicKey: p.publicKey,
    accountId: p.accountId,
  });
}

/** Returns the payload or null when the text is not a valid Xenia visit QR. Never throws. */
export function parseQrPayload(text: string): VisitQrPayload | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const { shopId, visitId, publicKey, accountId } = o;
  if (typeof shopId !== "string" || !shopId) return null;
  if (typeof visitId !== "string" || !visitId) return null;
  if (typeof publicKey !== "string" || !HEX64.test(publicKey.toLowerCase())) return null;
  if (typeof accountId !== "string" || !SUI_ID.test(accountId)) return null;
  return { shopId, visitId, publicKey: publicKey.toLowerCase(), accountId };
}
