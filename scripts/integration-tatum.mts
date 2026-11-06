/**
 * Integration: verify one REAL mainnet USDC transfer end to end via Tatum (read-only, no funds moved).
 * Digest: a public 898.8502 USDC transfer found in checkpoint 341984914. Run: npx tsx scripts/integration-tatum.mts [digest payee minUsdc]
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const { verifyUsdcPayment, getBalances, resolveName } = await import("../src/lib/tatum/index");

const [digest = "6ZEL2tydFGaayLySMzoxdQAGquZoKy9w3ZUDtVthHSoP", payee = "0x78a7ca88188061438fcaca8f8bd0fd4dcdd839a84edf5df8c4bdb54a78889ad4", min = "898.85"] = process.argv.slice(2);
process.env.XENIA_DATA_DIR ??= "/tmp/xenia-integration";
const show = (l: string, v: unknown) => console.log(`\n${l}\n${JSON.stringify(v, null, 2)}`);

show("1. true payee, min 898.85 (expect ok)", await verifyUsdcPayment({ digest, expectedPayee: payee, minAmountUsdc: min }));
show("2. same digest, min 1000 (expect underpaid)", await verifyUsdcPayment({ digest, expectedPayee: payee, minAmountUsdc: "1000" }));
show("3. wrong payee (expect not ok)", await verifyUsdcPayment({ digest, expectedPayee: "0x" + "ab".repeat(32), minAmountUsdc: "1" }));
show("4. unknown digest (expect NOT_FOUND)", await verifyUsdcPayment({ digest: "11111111111111111111111111111112", expectedPayee: payee, minAmountUsdc: "1" }));
show("5. getBalances(payee)", await getBalances(payee));
show("6. resolveName(payee)", await resolveName(payee));
