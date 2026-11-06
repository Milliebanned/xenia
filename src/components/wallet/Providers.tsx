"use client";
/**
 * WALLET LAYER (owner: visit/wallet agent). Usage notes for the UI agent:
 *
 *  1. Wrap the app once, e.g. in src/app/layout.tsx:
 *       import { Providers } from "@/components/wallet/Providers";
 *       <body><Providers>{children}</Providers></body>
 *     `Providers` is a client component, safe to render from a server layout. It renders children
 *     immediately (SSR-safe); the wallet context appears after hydration, so wallet-dependent UI
 *     must tolerate "not ready yet" (the components below already do).
 *  2. <WalletConnectButton /> renders the dApp Kit connect button (Slush, Sui Wallet, etc.), mainnet.
 *  3. useOwnerSigner() returns { ready, address, walletSigner, suiClient }.
 *     `walletSigner` is exactly the MemWal `WalletSigner` shape (address, signAndExecuteTransaction,
 *     signPersonalMessage) and is null until a wallet is connected.
 *  4. Use grantDelegateKey()/revokeDelegateKey() from ./actions to sign the visit transactions;
 *     they take the `walletAction` object returned by /api/visit/create and /api/visit/revoke-start.
 *
 * Note: this uses @mysten/dapp-kit-react (2.x, gRPC / @mysten/sui ^2). It does NOT use React Query,
 * so no QueryClientProvider is needed. The legacy @mysten/dapp-kit 1.x is JSON-RPC only, deprecated,
 * and public JSON-RPC fullnodes are shut down.
 */
import { useSyncExternalStore, type ReactNode } from "react";
import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { getDAppKit } from "./dapp-kit";

const subscribe = () => () => {};

export function Providers({ children }: { children: ReactNode }) {
  // Server snapshot is null, client snapshot is the kit: React swaps after hydration without a mismatch.
  const kit = useSyncExternalStore(subscribe, getDAppKit, () => null);
  if (!kit) return <>{children}</>;
  return <DAppKitProvider dAppKit={kit}>{children}</DAppKitProvider>;
}
