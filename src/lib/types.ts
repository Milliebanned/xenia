/**
 * Shared contracts for Xenia: every module builds against these types.
 * Change fields with care: the UI, API routes and lib modules all depend on them.
 */

export type FactKind = "order" | "allergy" | "nickname" | "preference" | "payment_habit";

export type SaveStatus = "saving" | "saved" | "failed";

/** A fact the customer has told us (or we learned), stored in Walrus Memory. */
export interface ProfileFact {
  localId: string; // client-side id, stable before the write finishes
  text: string; // short, specific, dated sentence: "[2026-11-05] Usual order: skin fade, number 2 on the sides."
  kind: FactKind;
  createdAt: string; // ISO
  status: SaveStatus;
  jobId?: string; // relayer remember job
  blobId?: string; // Walrus blob id once saved (proof!)
  error?: string;
}

/** A memory returned by recall. */
export interface RecalledFact {
  text: string;
  distance: number; // cosine distance, lower = closer. Cutoff ~0.5 (docs: >0.55 is noisy)
  blobId: string;
  createdAt?: string;
  /** Set by the learning engine when a newer fact contradicts this one (memories are immutable; supersession is app logic). */
  superseded?: boolean;
  supersededBy?: string; // blobId of the newer fact
}

/** Why the app suggested something: the memories that caused it. Shown in the UI. */
export interface Suggestion {
  id: string;
  kind: "usual_order" | "tab_reminder" | "allergy_warning" | "habit";
  headline: string; // "Usual: skin fade, number 2 on the sides"
  because: RecalledFact[]; // evidence, shown to the user ("why am I seeing this?")
}

/** Result of verifying a Sui USDC payment via Tatum gRPC (LedgerService.GetTransaction). */
export interface VerifiedPayment {
  digest: string;
  ok: boolean; // executed successfully AND paid the expected payee at least the expected amount
  amountUsdc: string; // decimal string, e.g. "4.50"
  payer?: string;
  payee?: string;
  coinType?: string;
  timestampMs?: number;
  reason?: string; // when ok=false: why
}

export interface TabEntry {
  id: string;
  customerId: string;
  shopId: string;
  amountUsdc: string;
  note?: string;
  createdAt: string; // ISO
  settledByDigest?: string; // set when a VerifiedPayment settles it
  settledAt?: string;
}

/** A per-visit delegate key grant on the customer's shareable profile account. */
export interface VisitSession {
  id: string;
  shopId: string;
  customerAccountId: string;
  delegatePublicKey: string; // hex, the shop's per-visit key
  grantedAt: string;
  grantDigest?: string; // Sui tx digest of add_delegate_key
  revokedAt?: string;
  revokeDigest?: string;
  status: "pending" | "active" | "revoking" | "revoked" | "failed";
}

/** Memory service the UI/API layers call. Implemented in src/lib/memory (owner: memory agent). */
export interface MemoryService {
  /** Save one short fact. Returns immediately with status "saving"; resolves status in background. */
  saveFact(text: string, kind: FactKind): Promise<ProfileFact>;
  /** Free text -> facts via Walrus `analyze`; each extracted fact is saved. */
  learnFromText(freeText: string): Promise<ProfileFact[]>;
  /** Recall relevant facts, already filtered by distance cutoff and de-duplicated. Never hangs (own timeout). */
  recall(query: string, opts?: { limit?: number; maxDistance?: number }): Promise<RecalledFact[]>;
  /** Suggestions for a shop visit, each with the memories that caused it. */
  suggestionsForVisit(): Promise<Suggestion[]>;
  /** Current status of locally known facts (saving/saved/failed), newest first. */
  listFacts(): ProfileFact[];
}
