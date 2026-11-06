"use client";
import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";

/** Public mainnet gRPC-web endpoint (same one the MemWal SDK defaults to). */
const GRPC_URL = "https://fullnode.mainnet.sui.io:443";

export function createXeniaDAppKit() {
  return createDAppKit({
    networks: ["mainnet"],
    defaultNetwork: "mainnet",
    createClient: (network) => new SuiGrpcClient({ network, baseUrl: GRPC_URL }),
    autoConnect: true,
  });
}

export type XeniaDAppKit = ReturnType<typeof createXeniaDAppKit>;

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: XeniaDAppKit;
  }
}

let instance: XeniaDAppKit | null = null;
/** Lazy browser-only singleton (wallet detection needs `window`). Returns null on the server. */
export function getDAppKit(): XeniaDAppKit | null {
  if (typeof window === "undefined") return null;
  return (instance ??= createXeniaDAppKit());
}
