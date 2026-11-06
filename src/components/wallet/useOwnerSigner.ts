"use client";
import { useContext, useMemo, useSyncExternalStore } from "react";
import { DAppKitContext } from "@mysten/dapp-kit-react";
import type { WalletSigner } from "./types";

/**
 * Returns a `walletSigner` shaped for @mysten-incubation/memwal/account createAccount /
 * addDelegateKey / removeDelegateKey (their `WalletSigner`), plus the dApp Kit `suiClient` to pass
 * as `suiClient` (the SDK uses it for waitForTransaction).
 *
 * Safe to call before <Providers> has mounted: returns { ready: false, walletSigner: null }.
 */
export function useOwnerSigner(): {
  ready: boolean;
  address: string | null;
  walletSigner: WalletSigner | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient: any | null;
} {
  const kit = useContext(DAppKitContext);
  // Not useCurrentAccount(): it throws without a provider (SSR / before hydration). Read the same store directly.
  const conn = useSyncExternalStore(
    (cb) => (kit ? kit.stores.$connection.subscribe(cb) : () => {}),
    () => (kit ? kit.stores.$connection.get() : null),
    () => null,
  );
  const account = conn?.account ?? null;
  const address = account?.address ?? null;

  return useMemo(() => {
    if (!kit || !address) return { ready: !!kit, address, walletSigner: null, suiClient: null };
    const walletSigner: WalletSigner = {
      address,
      // dApp Kit builds the tx with the current network's client and fills in the sender.
      signAndExecuteTransaction: async ({ transaction }) => {
        const r = await kit.signAndExecuteTransaction({ transaction });
        if (r.$kind === "FailedTransaction") {
          throw new Error(`Transaction ${r.FailedTransaction.digest} failed: ${r.FailedTransaction.status.error?.message ?? "unknown"}`);
        }
        return { $kind: "Transaction", Transaction: { digest: r.Transaction.digest } };
      },
      signPersonalMessage: async ({ message }) => {
        const r = await kit.signPersonalMessage({ message });
        return { signature: r.signature };
      },
    };
    return { ready: true, address, walletSigner, suiClient: kit.getClient("mainnet") };
  }, [kit, address]);
}
