/** Integer micro-USDC helpers. USDC on Sui has 6 decimals (verified via getCoinMetadata). No floats. */
export const USDC_DECIMALS = 6;

/** Parse a decimal string like "4.5" or "0.000001" to micro-USDC. Throws on bad input or >6 decimals. */
export function parseUsdc(s: string): bigint {
  if (typeof s !== "string" || !/^\d+(\.\d{1,6})?$/.test(s.trim())) {
    throw new Error(`invalid USDC amount: ${JSON.stringify(s)}`);
  }
  const [whole, frac = ""] = s.trim().split(".");
  return BigInt(whole) * BigInt(1000000) + BigInt(frac.padEnd(USDC_DECIMALS, "0"));
}

/** Format micro-USDC as a decimal string with at least 2 decimals: BigInt(4500000) -> "4.50", BigInt(1) -> "0.000001". */
export function formatUsdc(micro: bigint): string {
  const neg = micro < BigInt(0);
  const abs = neg ? -micro : micro;
  const whole = abs / BigInt(1000000);
  let frac = (abs % BigInt(1000000)).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  if (frac.length < 2) frac = frac.padEnd(2, "0");
  return `${neg ? "-" : ""}${whole}.${frac}`;
}
