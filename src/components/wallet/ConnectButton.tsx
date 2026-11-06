"use client";
import dynamic from "next/dynamic";
import { useContext } from "react";
import { DAppKitContext } from "@mysten/dapp-kit-react";

// The web-component button touches `customElements`, so it must never be server rendered.
const Inner = dynamic(() => import("./ConnectButtonInner"), { ssr: false });

/** Wallet connect button. Renders nothing until <Providers> has mounted the wallet context. */
export function WalletConnectButton() {
  const kit = useContext(DAppKitContext);
  if (!kit) return <button disabled>Wallet loading...</button>;
  return <Inner />;
}
