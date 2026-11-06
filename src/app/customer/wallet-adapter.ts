"use client";
/**
 * WALLET ADAPTER: the single seam between the customer UI and the real browser wallet.
 * Real mode: grant/revoke use the MemWal account actions, pay builds a native USDC transfer; the user's
 * wallet shows its own approval popup for every one. Mock mode (NEXT_PUBLIC_USE_MOCKS=1) fabricates digests.
 */
import { useCallback, useMemo } from "react";
import { grantDelegateKey, revokeDelegateKey, useOwnerSigner, type WalletActionInput } from "@/components/wallet";
import { USE_MOCKS } from "@/app/lib-client/api";
import { buildUsdcTransfer } from "./pay-usdc";

const fake = (p: string) => `DEMO-${p}-${Math.random().toString(36).slice(2, 12)}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useWalletAdapter() {
  const { ready, address, walletSigner, suiClient } = useOwnerSigner();

  const need = useCallback(() => {
    if (!walletSigner || !suiClient) throw new Error("Connect your wallet first.");
    return { walletSigner, suiClient };
  }, [walletSigner, suiClient]);

  const grant = useCallback(
    async (a: WalletActionInput): Promise<string> => {
      if (USE_MOCKS) { await sleep(600); return fake("grant"); }
      const { walletSigner, suiClient } = need();
      return grantDelegateKey(walletSigner, suiClient, a);
    },
    [need],
  );

  const revoke = useCallback(
    async (a: WalletActionInput): Promise<string> => {
      if (USE_MOCKS) { await sleep(400); return fake("revoke"); }
      const { walletSigner, suiClient } = need();
      return revokeDelegateKey(walletSigner, suiClient, a);
    },
    [need],
  );

  /** Builds and signs a native-USDC transfer to `payee` (the shop). The wallet popup is the final confirmation. */
  const pay = useCallback(
    async (o: { amountUsdc: string; payee: string }): Promise<string> => {
      if (USE_MOCKS) { await sleep(900); return fake("pay"); }
      const { walletSigner, suiClient } = need();
      const tx = await buildUsdcTransfer({ client: suiClient.core ?? suiClient, owner: walletSigner.address, payee: o.payee, amountUsdc: o.amountUsdc });
      const r = (await walletSigner.signAndExecuteTransaction({ transaction: tx })) as {
        $kind?: string;
        digest?: string;
        Transaction?: { digest: string };
        FailedTransaction?: { digest: string };
      };
      if (r.$kind === "FailedTransaction") throw new Error(`Payment transaction ${r.FailedTransaction?.digest ?? ""} failed on chain`);
      const digest = r.Transaction?.digest ?? r.digest;
      if (!digest) throw new Error("Wallet returned no transaction digest");
      try {
        await suiClient.core?.waitForTransaction?.({ digest, timeout: 20_000 });
      } catch {
        /* verification retries server-side; indexing lag is not a failure */
      }
      return digest;
    },
    [need],
  );

  return useMemo(
    () => ({
      ready: USE_MOCKS ? true : ready,
      connected: USE_MOCKS ? true : !!walletSigner,
      address: USE_MOCKS ? "0x" + "ad".repeat(32) : address,
      grant,
      revoke,
      pay,
    }),
    [ready, walletSigner, address, grant, revoke, pay],
  );
}
