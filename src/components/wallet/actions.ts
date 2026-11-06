"use client";
import { addDelegateKey, removeDelegateKey } from "@mysten-incubation/memwal/account";
import type { WalletSigner } from "./types";

/** Matches `walletAction` in the /api/visit/create and /api/visit/revoke-start responses. */
export interface WalletActionInput {
  packageId: string;
  registryId: string;
  accountId: string;
  publicKey: string;
  label: string;
  ownerAddress: string;
}

function assertOwner(signer: WalletSigner, a: WalletActionInput) {
  if (signer.address.toLowerCase() !== a.ownerAddress.toLowerCase()) {
    throw new Error(
      `Connected wallet ${signer.address.slice(0, 8)}.. is not the account owner ${a.ownerAddress.slice(0, 8)}..; connect the owner wallet`,
    );
  }
}

/** Customer wallet signs add_delegate_key. Resolves with the tx digest (send it to /api/visit/grant-confirm). */
export async function grantDelegateKey(
  signer: WalletSigner,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient: any,
  a: WalletActionInput,
): Promise<string> {
  assertOwner(signer, a);
  const r = await addDelegateKey({
    packageId: a.packageId,
    registryId: a.registryId,
    accountId: a.accountId,
    publicKey: a.publicKey,
    label: a.label,
    walletSigner: signer,
    suiClient,
    suiNetwork: "mainnet",
  });
  return r.digest;
}

/** Customer wallet signs remove_delegate_key. Resolves with the tx digest (send to /api/visit/revoke-confirm). */
export async function revokeDelegateKey(
  signer: WalletSigner,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient: any,
  a: WalletActionInput,
): Promise<string> {
  assertOwner(signer, a);
  const r = await removeDelegateKey({
    packageId: a.packageId,
    registryId: a.registryId,
    accountId: a.accountId,
    publicKey: a.publicKey,
    walletSigner: signer,
    suiClient,
    suiNetwork: "mainnet",
  });
  return r.digest;
}
