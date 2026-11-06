/**
 * Visit-session types that extend (never modify) the shared contract in src/lib/types.ts.
 * Everything here that crosses the API boundary is PUBLIC: it must never contain the shop's
 * per-visit private key. `toPublicState` in service.ts is the single whitelist that enforces it.
 */
import type { RecalledFact, VisitSession } from "@/lib/types";

/** Contents of the QR code the customer app shows / the shop screen scans (or vice versa). */
export interface VisitQrPayload {
  shopId: string;
  visitId: string;
  /** Hex Ed25519 public key (64 chars) of the shop's per-visit delegate key. */
  publicKey: string;
  /** Customer's shareable PROFILE account object id. */
  accountId: string;
}

/** Measured evidence for the demo moment. All durations are milliseconds. */
export interface VisitTimings {
  grantSubmittedAt?: string; // ISO, when grant-confirm was called (digest known)
  grantListedMs?: number; // digest submitted -> key visible in relayer delegate-keys list
  revokeSubmittedAt?: string; // ISO, when revoke-confirm was called
  keyRemovedFromListMs?: number; // digest submitted -> key gone from relayer delegate-keys list
  /** digest submitted -> first shop recall rejected with an auth error (null = never rejected in time). */
  shopRecallDeniedMs?: number | null;
  /** key gone from list -> first shop recall rejected. */
  deniedAfterListMs?: number | null;
  recallProbes?: number; // how many shop recall probes were made while measuring
  /** Pasteable lines, also printed to the server console with prefix [visit-evidence]. */
  evidence: string[];
}

/** What the API returns about a visit. Never includes any private key. */
export interface VisitState {
  session: VisitSession;
  ownerAddress: string;
  timings: VisitTimings;
  lastError?: string;
}

/** What the customer's wallet needs to sign addDelegateKey / removeDelegateKey. */
export interface WalletAction {
  packageId: string;
  registryId: string;
  accountId: string;
  /** Hex public key to add / remove. */
  publicKey: string;
  /** Human label for add_delegate_key. */
  label: string;
  /** The wallet that must sign (account owner). */
  ownerAddress: string;
}

export interface CreateVisitResult extends VisitState {
  walletAction: WalletAction;
  qr: VisitQrPayload;
}

export interface RevokeStartResult extends VisitState {
  walletAction: WalletAction;
}

export interface ShopRecallResult {
  visitId: string;
  facts: RecalledFact[];
}

/** Shape of the relayer's GET /api/accounts/:owner/delegate-keys. Verified against mainnet 2026-11-05. */
export interface RelayerDelegateKeys {
  account_id: string;
  keys: { public_key: string; sui_address?: string; label?: string; created_at?: number }[];
}

export class VisitError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "not_found"
      | "bad_request"
      | "bad_state"
      | "timeout"
      | "relayer"
      | "mismatch",
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "VisitError";
  }
}
