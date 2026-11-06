/** "corner-shop" -> "Corner Shop". Display only. */
export function shopName(id: string): string {
  const t = id.replace(/[-_]+/g, " ").trim();
  return t.replace(/\b\w/g, (c) => c.toUpperCase()) || "the shop";
}
