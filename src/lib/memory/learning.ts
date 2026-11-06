/**
 * Pure learning logic: classify memory text, resolve supersession, derive suggestions
 * and payment habits. No I/O here, so everything is unit-testable.
 *
 * Walrus memories are immutable. "Supersession" is therefore app logic over dated text:
 * for one fact kind, the newest dated fact wins; older facts with a different body are
 * kept as evidence but flagged `superseded`.
 */
import type { FactKind, RecalledFact, Suggestion } from "../types";

/** RecalledFact plus supersession info. Structurally assignable to RecalledFact (extra optional fields). */
export interface EvidenceFact extends RecalledFact {
  superseded?: boolean;
  supersededBy?: string; // blobId (or text) of the newer fact that replaced it
}

export interface ParsedFact {
  fact: RecalledFact;
  kind: FactKind;
  body: string; // text without date and label
  key: string; // normalised body for contradiction checks
  time: number; // ms, from the [date] in the text, else createdAt, else 0
  createdMs: number;
}

const LABELS: Record<FactKind, string> = {
  order: "Usual order",
  allergy: "Allergy",
  nickname: "Nickname",
  preference: "Preference",
  payment_habit: "Payment habit",
};

const DATE_RE = /^\s*\[(\d{4}-\d{2}-\d{2})\]\s*/;
const LABEL_RE = /^\s*(usual order|order|allergy|allergies|nickname|preference|payment habit)\s*:\s*/i;

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function classifyText(text: string): FactKind {
  const t = text.replace(DATE_RE, "");
  const label = t.match(LABEL_RE)?.[1]?.toLowerCase();
  if (label) {
    if (label.startsWith("allerg")) return "allergy";
    if (label.includes("order")) return "order";
    if (label === "nickname") return "nickname";
    if (label === "preference") return "preference";
    return "payment_habit";
  }
  if (/allerg|intoleran|anaphyla|coeliac|celiac/i.test(t)) return "allergy";
  if (/\b(settles?|tab|pays?|paid|payments?)\b/i.test(t)) return "payment_habit";
  if (/nickname|\bcalls? (me|him|her)\b|goes by|known as|my name is/i.test(t)) return "nickname";
  if (/\b(usual|orders?|flat white|latte|coffee|espresso|cappuccino|tea|mocha)\b/i.test(t)) return "order";
  return "preference";
}

/** Build the stored text: "[YYYY-MM-DD] Label: body". Idempotent if already dated/labelled. */
export function formatFactText(text: string, kind: FactKind, now = new Date()): string {
  let t = text.trim();
  const hasDate = DATE_RE.test(t);
  if (hasDate) t = t.replace(DATE_RE, "");
  const date = hasDate ? text.match(DATE_RE)![1] : isoDay(now);
  if (!LABEL_RE.test(t)) t = `${LABELS[kind]}: ${t}`;
  return `[${date}] ${t}`;
}

export function bodyOf(text: string): string {
  return text.replace(DATE_RE, "").replace(LABEL_RE, "").trim();
}

const STOP = new Set(["with", "and", "a", "the", "usual", "order", "my", "i", "is", "of", "on", "to"]);
export function normKey(body: string): string {
  return body
    .toLowerCase()
    .replace(/\.(?!\d)/g, " ")
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .sort()
    .join(" ");
}

export function parseFact(fact: RecalledFact): ParsedFact {
  const kind = classifyText(fact.text);
  const body = bodyOf(fact.text);
  const d = fact.text.match(DATE_RE)?.[1];
  const createdMs = fact.createdAt ? Date.parse(fact.createdAt) || 0 : 0;
  const time = d ? Date.parse(`${d}T00:00:00Z`) : createdMs;
  return { fact, kind, body, key: normKey(body), time, createdMs };
}

/** Near-duplicate removal: same normalised text (date included) or token Jaccard >= 0.9. Keeps lowest distance. */
export function dedupeRecalled(facts: RecalledFact[]): RecalledFact[] {
  const sorted = [...facts].sort((a, b) => a.distance - b.distance);
  const kept: { f: RecalledFact; tokens: Set<string> }[] = [];
  for (const f of sorted) {
    const tokens = new Set(
      f.text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean),
    );
    const dup = kept.some((k) => {
      if (f.blobId && k.f.blobId && f.blobId === k.f.blobId) return true;
      let inter = 0;
      for (const t of tokens) if (k.tokens.has(t)) inter++;
      const union = tokens.size + k.tokens.size - inter;
      return union > 0 && inter / union >= 0.9;
    });
    if (!dup) kept.push({ f, tokens });
  }
  return kept.map((k) => k.f);
}

export interface Resolved {
  winner: ParsedFact;
  current: ParsedFact[]; // facts that agree with the winner (corroborating evidence)
  superseded: ParsedFact[]; // older facts with a different body
}

/** Newest dated fact wins; same-day tie -> body with more supporting facts, then newest createdAt. */
export function resolveLatest(facts: ParsedFact[]): Resolved | null {
  if (!facts.length) return null;
  const top = Math.max(...facts.map((f) => f.time));
  const groups = new Map<string, ParsedFact[]>();
  for (const f of facts.filter((x) => x.time === top)) {
    groups.set(f.key, [...(groups.get(f.key) ?? []), f]);
  }
  const best = [...groups.values()].sort(
    (a, b) => b.length - a.length || Math.max(...b.map((x) => x.createdMs)) - Math.max(...a.map((x) => x.createdMs)),
  )[0];
  const winner = [...best].sort((a, b) => b.createdMs - a.createdMs)[0];
  const current = facts.filter((f) => f.key === winner.key);
  const superseded = facts.filter((f) => f.key !== winner.key);
  return { winner, current, superseded };
}

function evidence(r: Resolved): EvidenceFact[] {
  const cur = [...r.current].sort((a, b) => b.time - a.time).map((p) => ({ ...p.fact }));
  const by = r.winner.fact.blobId || r.winner.fact.text;
  const old = [...r.superseded]
    .sort((a, b) => b.time - a.time)
    .map((p) => ({ ...p.fact, superseded: true, supersededBy: by }));
  return [...cur, ...old];
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_NAMES = DAYS.map((d) => d[0].toUpperCase() + d.slice(1));

export function weekdayIn(text: string): number | null {
  const m = text.toLowerCase().match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?\b/);
  return m ? DAYS.indexOf(m[1]) : null;
}

/** Derive suggestions (with evidence) from recalled/known facts. `now` decides the weekday logic (UTC). */
export function buildSuggestions(facts: RecalledFact[], now: Date = new Date()): Suggestion[] {
  const parsed = facts.map(parseFact);
  const byKind = (k: FactKind) => parsed.filter((p) => p.kind === k);
  const out: Suggestion[] = [];

  // 1. Allergies: always surfaced, never superseded (safety). Distinct bodies combined.
  const allergies = byKind("allergy");
  if (allergies.length) {
    const distinct = new Map<string, ParsedFact>();
    for (const a of [...allergies].sort((x, y) => y.time - x.time)) if (!distinct.has(a.key)) distinct.set(a.key, a);
    out.push({
      id: "allergy_warning",
      kind: "allergy_warning",
      headline: `Allergy: ${[...distinct.values()].map((a) => a.body.replace(/[.\s]+$/, "")).join("; ")}`,
      because: [...allergies].sort((x, y) => y.time - x.time).map((a) => ({ ...a.fact })),
    });
  }

  // 2. Usual order, newest wins.
  const order = resolveLatest(byKind("order"));
  if (order) {
    out.push({
      id: "usual_order",
      kind: "usual_order",
      headline: `Usual: ${order.winner.body.replace(/[.\s]+$/, "")}`,
      because: evidence(order),
    });
  }

  // 3. Payment habit, newest wins; reminder near the weekday.
  const habit = resolveLatest(byKind("payment_habit"));
  if (habit) {
    const day = weekdayIn(habit.winner.body);
    const amount = habit.winner.body.match(/(\d+(?:\.\d+)?)\s*USDC/i)?.[1];
    const amt = amount ? ` (usually about ${amount} USDC)` : "";
    const delta = day === null ? null : (day - now.getUTCDay() + 7) % 7;
    if (day !== null && delta === 0) {
      out.push({
        id: "tab_reminder",
        kind: "tab_reminder",
        headline: `${DAY_NAMES[day]} is your usual tab day: settle your tab today${amt}`,
        because: evidence(habit),
      });
    } else if (day !== null && delta === 1) {
      out.push({
        id: "tab_reminder",
        kind: "tab_reminder",
        headline: `Tomorrow (${DAY_NAMES[day]}) is your usual tab day${amt}`,
        because: evidence(habit),
      });
    } else {
      out.push({
        id: "habit",
        kind: "habit",
        headline: day !== null ? `You usually settle your tab on ${DAY_NAMES[day]}s${amt}` : `Habit: ${habit.winner.body}`,
        because: evidence(habit),
      });
    }
  }
  return out;
}

export interface ObservedPayment {
  digest: string;
  timestampMs: number;
  amountUsdc: number | string;
}

export interface DerivedHabit {
  weekday: number | null;
  weekdayCount: number;
  observations: number;
  typicalAmount: string; // median, 2dp
  body: string; // e.g. "Settles tab on Fridays (3 of 4 payments, UTC); typical payment 4.50 USDC."
}

/** Needs >= 3 observations. Weekday only if it covers >= 2 payments and >= half of them (UTC). */
export function deriveHabit(payments: ObservedPayment[]): DerivedHabit | null {
  const uniq = new Map(payments.map((p) => [p.digest, p]));
  const ps = [...uniq.values()].filter((p) => Number.isFinite(p.timestampMs) && Number.isFinite(Number(p.amountUsdc)));
  if (ps.length < 3) return null;
  const counts = new Map<number, { n: number; last: number }>();
  for (const p of ps) {
    const d = new Date(p.timestampMs).getUTCDay();
    const c = counts.get(d) ?? { n: 0, last: 0 };
    counts.set(d, { n: c.n + 1, last: Math.max(c.last, p.timestampMs) });
  }
  const [wd, top] = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || b[1].last - a[1].last)[0];
  const useDay = top.n >= 2 && top.n / ps.length >= 0.5;
  const amts = ps.map((p) => Number(p.amountUsdc)).sort((a, b) => a - b);
  const mid = Math.floor(amts.length / 2);
  const median = amts.length % 2 ? amts[mid] : (amts[mid - 1] + amts[mid]) / 2;
  const typicalAmount = median.toFixed(2);
  const body = useDay
    ? `Settles tab on ${DAY_NAMES[wd]}s (${top.n} of ${ps.length} payments, UTC); typical payment ${typicalAmount} USDC.`
    : `Typical payment ${typicalAmount} USDC (${ps.length} payments, no fixed weekday).`;
  return { weekday: useDay ? wd : null, weekdayCount: top.n, observations: ps.length, typicalAmount, body };
}
