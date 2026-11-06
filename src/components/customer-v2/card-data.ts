import { CUSTOMER_KIND_LABEL, displayStoredText } from "@/lib/display";
import type { FactKind, ProfileFact } from "@/lib/types";

/** What the guest card shows. Built only from the user's own facts. */
export type CardData = {
  name: string;
  /** True when the name came from a "Goes by" fact. */
  named: boolean;
  usual?: string;
  pay?: string;
  notes?: string;
  important?: string;
};

const LABELS = Object.values(CUSTOMER_KIND_LABEL).map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const LABEL_RE = new RegExp(`^(?:${LABELS})\\s*:\\s*`, "i");

/** The readable part of a stored fact: no date, no "Your usual:" style label. */
export function factBody(text: string): string {
  const shown = displayStoredText(text).replace(/^\s*\[[^\]]*\]\s*/, "").replace(LABEL_RE, "").trim();
  return shown.charAt(0).toUpperCase() + shown.slice(1);
}

/** "[2026-11-05] ..." -> "5 Nov", or null. */
export function factDate(text: string, createdAt?: string): string | null {
  const raw = text.match(/^\s*\[([^\]]*)\]/)?.[1] ?? createdAt;
  const t = raw ? Date.parse(raw) : NaN;
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** First name for the greeting, from a "Goes by" fact. */
export function goesByName(facts: ProfileFact[] | null): string | null {
  const f = facts?.filter((x) => x.kind === "nickname" && x.status !== "failed").sort(byNewest)[0];
  if (!f) return null;
  const n = factBody(f.text).replace(/^(?:please\s+)?(?:call me|i go by|goes by|my name is|name)\s*[:,]?\s*/i, "").replace(/^(?:the\s+)?(?:nick ?name|name)\s+(?:is\s+)?/i, "").replace(/[.!]+$/, "").trim();
  if (!n || n.length > 24) return null;
  return n.charAt(0).toUpperCase() + n.slice(1);
}

const byNewest = (a: ProfileFact, b: ProfileFact) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

/** How many recent facts of each kind appear on the card. */
const TAKE: Record<FactKind, number> = { order: 2, allergy: 3, nickname: 1, preference: 2, payment_habit: 1 };

/**
 * Builds the wallet-pass card ONLY from the user's own facts. Newest first, de-duplicated,
 * failed saves left out. Returns null when there is nothing to show yet.
 */
export function buildCardData(facts: ProfileFact[] | null): CardData | null {
  if (!facts) return null;
  const seen = new Set<string>();
  const by: Record<FactKind, string[]> = { order: [], allergy: [], nickname: [], preference: [], payment_habit: [] };
  for (const f of [...facts].filter((x) => x.status !== "failed").sort(byNewest)) {
    const body = factBody(f.text);
    const key = `${f.kind}:${body.toLowerCase()}`;
    if (!body || seen.has(key) || by[f.kind].length >= TAKE[f.kind]) continue;
    seen.add(key);
    by[f.kind].push(body);
  }
  if (Object.values(by).every((v) => v.length === 0)) return null;
  const given = goesByName(facts);
  const name = given ?? "You";
  const join = (v: string[]) => (v.length ? v.map((s) => s.replace(/[.]+$/, "")).join(" · ") : undefined);
  return {
    name,
    named: !!given,
    usual: join(by.order),
    pay: join(by.payment_habit),
    notes: join(by.preference),
    important: join(by.allergy),
  };
}
