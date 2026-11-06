/**
 * The ONLY module the UI uses to talk to the backend.
 *
 * Default is REAL (calls /api/*). Set NEXT_PUBLIC_USE_MOCKS=1 (then restart `next dev`) for offline UI work;
 * the "Demo data" badge shows only in that mode.
 *
 * ACTUAL ROUTE SHAPES (verified from route source):
 *   POST /api/memory/learn        {text}                       -> {facts: ProfileFact[]}   (202)
 *   GET  /api/memory/facts                                     -> {facts: ProfileFact[]}
 *   GET  /api/memory/suggestions                               -> {suggestions: Suggestion[]}
 *   GET  /api/shop/config                                      -> ShopConfig
 *   POST /api/visit/create        {shopId, customerAccountId, ownerAddress?} -> CreateVisitResult
 *   POST /api/visit/grant-confirm {visitId, digest}            -> VisitState
 *   GET  /api/visit/state?visitId=                             -> VisitState
 *   POST /api/visit/revoke-start  {visitId}                    -> RevokeStartResult
 *   POST /api/visit/revoke-confirm{visitId, digest}            -> VisitState (blocks up to ~2.5 min, measures timings)
 *   GET  /api/shop/state?visitId=                              -> ShopState
 *   POST /api/tab/charge          {customerId, shopId, amountUsdc, note?} -> {entry, openTotalUsdc}
 *   GET  /api/tab?customerId=&shopId=                          -> {open: TabEntry[], openTotalUsdc}
 *   POST /api/pay/verify          {digest, customerId, shopId} -> {payment, settlement, tab, openTotalUsdc}
 */
import type { FactKind, ProfileFact, RecalledFact, Suggestion, TabEntry, VerifiedPayment, VisitSession } from "@/lib/types";
import type { CreateVisitResult, RevokeStartResult, VisitState, WalletAction } from "@/lib/visit/types";
import { encodeQrPayload, parseQrPayload as parseVisitQr } from "@/lib/visit/qr";
import { parseFact } from "@/lib/memory/learning";

export type { VisitState, CreateVisitResult, RevokeStartResult, WalletAction };
export { parseVisitQr };

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

export interface ShopConfig {
  shopAddress: string | null;
  demoAccountId: string | null;
  demoOwnerAddress: string | null;
  memwal: { packageId: string; registryId: string } | null;
  network: string;
}
export interface TabState {
  open: TabEntry[];
  openTotalUsdc: string;
}
export interface ShopState {
  visit: VisitState;
  facts: RecalledFact[];
  recallRejected: boolean;
  recallError?: string;
  tab: TabEntry[];
  openTotalUsdc: string;
  suggestions: Suggestion[];
}
export interface VerifyResult {
  payment: VerifiedPayment;
  settlement: { settled: boolean; reason?: string; appliedUsdc: string } | null;
  tab: TabEntry[];
  openTotalUsdc: string;
}

/** What the counter screen shows, derived from recalled facts shaped like "[date] Usual order: ...". */
export interface ShopProfile {
  nickname: string | null;
  usualOrder: string | null;
  allergies: string[];
  notes: string[];
  howTheyPay: string[];
}

/** Newest dated fact wins per kind; allergies are all distinct bodies (safety). */
export function profileFromRecalled(facts: RecalledFact[]): ShopProfile {
  const parsed = facts.map(parseFact);
  const newest = (k: FactKind) => parsed.filter((p) => p.kind === k).sort((a, b) => b.time - a.time || a.fact.distance - b.fact.distance)[0];
  const clean = (s: string) => s.replace(/[.\s]+$/, "");
  const allergies = [...new Set(parsed.filter((p) => p.kind === "allergy").map((p) => clean(p.body)))];
  return {
    nickname: newest("nickname") ? clean(newest("nickname").body) : null,
    usualOrder: newest("order") ? clean(newest("order").body) : null,
    allergies,
    notes: parsed.filter((p) => p.kind === "preference").map((p) => clean(p.body)),
    howTheyPay: parsed.filter((p) => p.kind === "payment_habit").map((p) => clean(p.body)),
  };
}

// ---------------------------------------------------------------- fetch helpers

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error ?? j.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}
const post = <T>(url: string, body: unknown) => http<T>(url, { method: "POST", body: JSON.stringify(body) });
const q = encodeURIComponent;

// ---------------------------------------------------------------- public API

export async function learn(text: string): Promise<ProfileFact[]> {
  if (USE_MOCKS) return mock.learn(text);
  return (await post<{ facts: ProfileFact[] }>("/api/memory/learn", { text })).facts;
}
export async function listFacts(): Promise<ProfileFact[]> {
  if (USE_MOCKS) return mock.listFacts();
  return (await http<{ facts: ProfileFact[] }>("/api/memory/facts")).facts;
}
export async function getSuggestions(): Promise<Suggestion[]> {
  if (USE_MOCKS) return mock.suggestions();
  return (await http<{ suggestions: Suggestion[] }>("/api/memory/suggestions")).suggestions;
}
export async function getShopConfig(): Promise<ShopConfig> {
  if (USE_MOCKS) return mock.config();
  return http<ShopConfig>("/api/shop/config");
}
export async function createVisit(shopId: string, customerAccountId: string, ownerAddress?: string): Promise<CreateVisitResult> {
  if (USE_MOCKS) return mock.createVisit(shopId, customerAccountId);
  return post("/api/visit/create", { shopId, customerAccountId, ownerAddress });
}
export async function grantConfirm(visitId: string, digest: string): Promise<VisitState> {
  if (USE_MOCKS) return mock.grantConfirm(visitId, digest);
  return post("/api/visit/grant-confirm", { visitId, digest });
}
export async function getVisitState(visitId: string): Promise<VisitState> {
  if (USE_MOCKS) return mock.visitState(visitId);
  return http(`/api/visit/state?visitId=${q(visitId)}`);
}
export async function revokeStart(visitId: string): Promise<RevokeStartResult> {
  if (USE_MOCKS) return mock.revokeStart(visitId);
  return post("/api/visit/revoke-start", { visitId });
}
export async function revokeConfirm(visitId: string, digest: string): Promise<VisitState> {
  if (USE_MOCKS) return mock.revokeConfirm(visitId, digest);
  return post("/api/visit/revoke-confirm", { visitId, digest });
}
export async function getShopState(visitId: string): Promise<ShopState> {
  if (USE_MOCKS) return mock.shopState(visitId);
  return http(`/api/shop/state?visitId=${q(visitId)}`);
}
export async function addCharge(customerId: string, shopId: string, amountUsdc: string, note?: string): Promise<TabEntry> {
  if (USE_MOCKS) return mock.charge(customerId, shopId, amountUsdc, note);
  return (await post<{ entry: TabEntry }>("/api/tab/charge", { customerId, shopId, amountUsdc, note })).entry;
}
export async function getTab(customerId: string, shopId: string): Promise<TabState> {
  if (USE_MOCKS) return mock.tab(customerId, shopId);
  return http(`/api/tab?customerId=${q(customerId)}&shopId=${q(shopId)}`);
}
export async function verifyPayment(digest: string, customerId: string, shopId: string): Promise<VerifyResult> {
  if (USE_MOCKS) return mock.verify(digest, customerId, shopId);
  return post("/api/pay/verify", { digest, customerId, shopId });
}

// ---------------------------------------------------------------- codes (customer <-> shop)

export interface CustomerCode {
  accountId: string;
  ownerAddress: string | null;
}
export function encodeCustomerCode(c: CustomerCode): string {
  return JSON.stringify({ type: "xenia-customer", accountId: c.accountId, ownerAddress: c.ownerAddress });
}
/** Accepts the JSON customer code or a bare 0x account object id. */
export function parseCustomerCode(raw: string): CustomerCode | null {
  const t = raw.trim();
  if (/^0x[0-9a-fA-F]{1,64}$/.test(t)) return { accountId: t, ownerAddress: null };
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    if (typeof j.accountId === "string" && /^0x[0-9a-fA-F]{1,64}$/.test(j.accountId)) {
      const o = typeof j.ownerAddress === "string" && /^0x[0-9a-fA-F]{1,64}$/.test(j.ownerAddress) ? j.ownerAddress : null;
      return { accountId: j.accountId, ownerAddress: o };
    }
  } catch {}
  return null;
}

// ================================================================ MOCKS
// EVERYTHING BELOW IS DEMO DATA. Nothing here touches Walrus, Tatum or Sui.
// State lives in localStorage so /customer and /shop in the same browser stay in sync.

interface MockVisit { state: VisitState; qr: string }
interface MockDb {
  facts: ProfileFact[];
  visits: Record<string, MockVisit>;
  charges: TabEntry[];
}
const KEY = "xenia-mock-db-v2";
const MOCK_ACCOUNT = "0x" + "de".repeat(32);
const MOCK_OWNER = "0x" + "ad".repeat(32);
const MOCK_SHOP = "0x" + "5a".repeat(32);

function load(): MockDb {
  if (typeof window === "undefined") return { facts: [], visits: {}, charges: [] };
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? "") as MockDb;
    if (d && d.visits) return d;
  } catch {}
  return { facts: [], visits: {}, charges: [] };
}
function save(db: MockDb) {
  localStorage.setItem(KEY, JSON.stringify(db));
}
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const rid = () => Math.random().toString(36).slice(2, 10);
const fakeHex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const strip = (t: string) => t.replace(/^\[[^\]]*\]\s*/, "");

function classify(s: string): FactKind {
  if (/allerg|intoleran/i.test(s)) return "allergy";
  if (/call me|my name|nickname/i.test(s)) return "nickname";
  if (/tab|friday|settle|pay/i.test(s)) return "payment_habit";
  if (/usual|weekly|fade|hemmed|drives/i.test(s)) return "order";
  return "preference";
}
function settleFacts(db: MockDb): boolean {
  let changed = false;
  for (const f of db.facts) {
    if (f.status === "saving" && Date.now() - Date.parse(f.createdAt) > 3500) {
      f.status = "saved";
      f.blobId = `demo${fakeHex(40)}`;
      changed = true;
    }
  }
  return changed;
}
function demoRecalled(db: MockDb): RecalledFact[] {
  const saved = db.facts.filter((f) => f.status === "saved" && f.blobId);
  const src = saved.length
    ? saved.map((f, i) => ({ text: f.text, blobId: f.blobId!, distance: 0.18 + i * 0.04, createdAt: f.createdAt }))
    : [
        { text: "[2026-11-05] Nickname: Maya", blobId: "demo-n", distance: 0.2 },
        { text: "[2026-11-05] Usual order: skin fade, number 2 on the sides, scissors on top", blobId: "demo-o", distance: 0.2 },
        { text: "[2026-11-05] Allergy: penicillin", blobId: "demo-a", distance: 0.2 },
      ];
  return src;
}
function mockWalletAction(v: VisitSession, owner: string): WalletAction {
  return { packageId: "0xDEMO", registryId: "0xDEMO", accountId: v.customerAccountId, publicKey: v.delegatePublicKey, label: `Xenia visit ${v.shopId}`, ownerAddress: owner };
}
function tabFor(db: MockDb, c: string, s: string) {
  const open = db.charges.filter((e) => e.customerId === c && e.shopId === s && !e.settledByDigest);
  const total = open.reduce((a, e) => a + Math.round(Number(e.amountUsdc) * 1e6), 0) / 1e6;
  return { open, openTotalUsdc: total.toFixed(2) };
}
function getV(db: MockDb, id: string): MockVisit {
  const v = db.visits[id];
  if (!v) throw new Error("Unknown visit (demo mode: is the shop screen open in this browser?)");
  return v;
}

const mock = {
  async config(): Promise<ShopConfig> {
    return { shopAddress: MOCK_SHOP, demoAccountId: MOCK_ACCOUNT, demoOwnerAddress: MOCK_OWNER, memwal: { packageId: "0xDEMO", registryId: "0xDEMO" }, network: "demo" };
  },
  async learn(text: string): Promise<ProfileFact[]> {
    await wait(400);
    const db = load();
    const date = new Date().toISOString().slice(0, 10);
    const parts = text.split(/[.;\n]+/).map((s) => s.trim()).filter((s) => s.length > 2);
    const out: ProfileFact[] = (parts.length ? parts : [text.trim()]).map((p) => ({
      localId: rid(),
      text: `[${date}] ${p.charAt(0).toUpperCase()}${p.slice(1)}.`,
      kind: classify(p),
      createdAt: new Date().toISOString(),
      status: "saving" as const,
    }));
    db.facts = [...out, ...db.facts];
    save(db);
    return out;
  },
  async listFacts(): Promise<ProfileFact[]> {
    await wait(120);
    const db = load();
    if (settleFacts(db)) save(db);
    return db.facts;
  },
  async suggestions(): Promise<Suggestion[]> {
    await wait(150);
    const db = load();
    const out: Suggestion[] = [];
    const order = db.facts.find((f) => f.status === "saved" && f.kind === "order");
    if (order && order.blobId)
      out.push({ id: "s-order", kind: "usual_order", headline: `Usual: ${strip(order.text).replace(/^Usual( order)?:\s*/i, "").replace(/\.$/, "")}`, because: [{ text: order.text, blobId: order.blobId, distance: 0.2 }] });
    return out;
  },
  async createVisit(shopId: string, accountId: string): Promise<CreateVisitResult> {
    await wait(200);
    const db = load();
    const session: VisitSession = { id: `v${rid()}`, shopId, customerAccountId: accountId, delegatePublicKey: fakeHex(64), grantedAt: new Date().toISOString(), status: "pending" };
    const qr = { shopId, visitId: session.id, publicKey: session.delegatePublicKey, accountId };
    const state: VisitState = { session, ownerAddress: MOCK_OWNER, timings: { evidence: [] } };
    db.visits[session.id] = { state, qr: encodeQrPayload(qr) };
    save(db);
    return { ...state, walletAction: mockWalletAction(session, MOCK_OWNER), qr };
  },
  async grantConfirm(id: string, digest: string): Promise<VisitState> {
    await wait(900);
    const db = load();
    const v = getV(db, id);
    v.state.session.status = "active";
    v.state.session.grantDigest = digest;
    v.state.session.grantedAt = new Date().toISOString();
    v.state.timings = { ...v.state.timings, grantListedMs: 2100, evidence: [`DEMO grant listed 2100ms after ${digest}`] };
    save(db);
    return v.state;
  },
  async visitState(id: string): Promise<VisitState> {
    await wait(100);
    return getV(load(), id).state;
  },
  async revokeStart(id: string): Promise<RevokeStartResult> {
    await wait(200);
    const db = load();
    const v = getV(db, id);
    v.state.session.status = "revoking";
    save(db);
    return { ...v.state, walletAction: mockWalletAction(v.state.session, MOCK_OWNER) };
  },
  async revokeConfirm(id: string, digest: string): Promise<VisitState> {
    await wait(3000);
    const db = load();
    const v = getV(db, id);
    v.state.session.status = "revoked";
    v.state.session.revokeDigest = digest;
    v.state.session.revokedAt = new Date().toISOString();
    v.state.timings = { ...v.state.timings, keyRemovedFromListMs: 2000, shopRecallDeniedMs: 3000, deniedAfterListMs: 1000, recallProbes: 2, evidence: ["DEMO: not measured"] };
    save(db);
    return v.state;
  },
  async shopState(id: string): Promise<ShopState> {
    await wait(100);
    const db = load();
    const v = getV(db, id);
    settleFacts(db);
    const t = tabFor(db, v.state.session.customerAccountId, v.state.session.shopId);
    return {
      visit: v.state,
      facts: v.state.session.status === "active" ? demoRecalled(db) : [],
      recallRejected: false,
      tab: t.open,
      openTotalUsdc: t.openTotalUsdc,
      suggestions: [],
    };
  },
  async charge(c: string, s: string, amountUsdc: string, note?: string): Promise<TabEntry> {
    await wait(250);
    const db = load();
    const entry: TabEntry = { id: rid(), customerId: c, shopId: s, amountUsdc: Number(amountUsdc).toFixed(2), note, createdAt: new Date().toISOString() };
    db.charges.push(entry);
    save(db);
    return entry;
  },
  async tab(c: string, s: string): Promise<TabState> {
    await wait(100);
    return tabFor(load(), c, s);
  },
  async verify(digest: string, c: string, s: string): Promise<VerifyResult> {
    await wait(900);
    const db = load();
    const t = tabFor(db, c, s);
    for (const e of t.open) {
      const m = db.charges.find((x) => x.id === e.id);
      if (m) { m.settledByDigest = digest; m.settledAt = new Date().toISOString(); }
    }
    save(db);
    const payment: VerifiedPayment = { digest, ok: true, amountUsdc: t.openTotalUsdc, reason: "DEMO: not verified on chain" };
    return { payment, settlement: { settled: true, appliedUsdc: t.openTotalUsdc }, tab: [], openTotalUsdc: "0.00" };
  },
};
