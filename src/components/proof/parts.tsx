import type { ReactNode } from "react";
import { OrbitGlyph } from "@/components/beam";

export type ChipState = "ok" | "no" | "unknown";

/** Status chip. Colour is never the only signal: the label and glyph carry it too. */
export function Chip({ s, label }: { s: ChipState; label: string }) {
  const glyph = s === "ok" ? "✓" : s === "no" ? "✕" : "?";
  return (
    <span className={`xp-chip is-${s}`}>
      <b aria-hidden>{glyph}</b>
      {label}
    </span>
  );
}

export function SectionHead({ id, tag, children, lead }: { id: string; tag: string; children: ReactNode; lead?: ReactNode }) {
  return (
    <header className="xp-sechead">
      <p className="xb-kicker">{tag}</p>
      <h2 id={id} className="xp-h2">
        {children}
      </h2>
      {lead && <p className="xp-lead">{lead}</p>}
    </header>
  );
}

/** Counter on a dark glass tile. `tone` is kept for callers; the tiles share one calm look. */
export function Stat({ label, value, of, note }: { label: string; value: number; of?: string; note: string; tone?: "orange" | "yellow" | "sky" | "lilac" }) {
  return (
    <div className="xp-stat">
      <p className="xp-stat-label">{label}</p>
      <p className="xp-stat-val">
        {value.toLocaleString("en-US")}
        {of && <span> {of}</span>}
      </p>
      <p className="xp-stat-note">{note}</p>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children: ReactNode; tone?: "orange" | "yellow" | "sky" }) {
  return (
    <div className="xp-empty">
      <span className="xp-empty-art" aria-hidden>
        <OrbitGlyph size={64} />
      </span>
      <div>
        <p className="xp-empty-t">{title}</p>
        <p className="xp-empty-b">{children}</p>
      </div>
    </div>
  );
}
