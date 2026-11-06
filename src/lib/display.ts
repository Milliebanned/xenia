import type { FactKind, Suggestion } from "@/lib/types";

/** What the customer sees for each stored kind. Internal kind keys and stored-text labels are unchanged. */
export const CUSTOMER_KIND_LABEL: Record<FactKind, string> = {
  order: "Your usual",
  allergy: "Important",
  nickname: "Goes by",
  preference: "Note",
  payment_habit: "How you pay",
};

const STORED_LABELS: [RegExp, string][] = [
  [/^usual(?: order)?\s*:/i, "Your usual:"],
  [/^allerg(?:y|ies)\s*:/i, "Important:"],
  [/^nickname\s*:/i, "Goes by:"],
  [/^preference\s*:/i, "Note:"],
  [/^payment habit\s*:/i, "How you pay:"],
];

/** Render-time relabel of a stored "[date] Label: body" sentence. Never used for storage or classification. */
export function displayStoredText(text: string): string {
  const m = text.match(/^(\s*\[[^\]]*\]\s*)?([\s\S]*)$/);
  const date = m?.[1] ?? "";
  let rest = m?.[2] ?? text;
  for (const [re, to] of STORED_LABELS) {
    if (re.test(rest)) { rest = rest.replace(re, to); break; }
  }
  return date + rest;
}

/** Suggestion headline for display. The headline string is built from stored text, so relabel it here. */
export function displayHeadline(s: Pick<Suggestion, "kind" | "headline">, who: "you" | "shop" = "you"): string {
  if (s.kind === "allergy_warning") return s.headline.replace(/^Allergy:/, "Heads-up:");
  if (s.kind === "usual_order") return s.headline.replace(/^Usual:/, who === "shop" ? "Their usual:" : "Your usual:");
  return s.headline;
}
