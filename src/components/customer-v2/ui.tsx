"use client";
/**
 * Customer app presentational pieces. Styles live in src/app/customer.css under .xenia-customer,
 * on top of the shared beam kit (src/components/beam). Nothing here talks to the network.
 */
import { useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { USE_MOCKS } from "@/app/lib-client/api";
import { shortId } from "@/components/ui";
import { ArrowRight, OrbitGlyph, XMark } from "@/components/beam";

export function cx(...a: Array<string | false | null | undefined>): string {
  return a.filter(Boolean).join(" ");
}

/** Custom property helper for staggered entry. */
export const stagger = (i: number): CSSProperties => ({ ["--i" as string]: i });

/* ---------- Buttons ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "light" | "danger";
  size?: "md" | "lg";
  block?: boolean;
  loading?: boolean;
  /** Trailing arrow, as on the reference's main actions. */
  arrow?: boolean;
};
const TONE = { primary: "is-white", ghost: "is-ghost", light: "is-glass", danger: "is-danger" } as const;
/** Sharp white button by default. */
export function Btn({ variant = "primary", size = "md", block, loading, arrow, className, children, disabled, type = "button", ...rest }: BtnProps) {
  return (
    <button
      type={type}
      className={cx("xb-btn xc-btn", TONE[variant], size === "lg" && "is-lg", block && "is-block", arrow && !loading && "has-arrow", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="xb-spin" aria-hidden="true" />}
      <span>{children}</span>
      {arrow && !loading && <ArrowRight />}
    </button>
  );
}

/* ---------- Tags ---------- */
const PILL = { green: "is-ok", ink: "is-live", coral: "is-bad", yellow: "is-warn", soft: "is-muted" } as const;
/** Small sharp status tag with a dot. */
export function Bubble({ tone = "green", children, className, live }: { tone?: "green" | "ink" | "coral" | "yellow" | "soft"; children: ReactNode; className?: string; live?: boolean }) {
  return (
    <span className={cx("xb-pill xc-bubble", PILL[tone], className)} role={live ? "status" : undefined}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

/** Quiet hairline label, e.g. "Shared · this visit only". */
export function Stamp({ children, tone = "green", className }: { children: ReactNode; tone?: "green" | "coral" | "ink"; className?: string }) {
  return <span className={cx("xc-stamp", `is-${tone}`, className)}>{children}</span>;
}

/* ---------- Tabs ---------- */
export type TabItem = { id: string; label: string };
/** Segmented tabs, like the reference's nav boxes. Keyboard: arrows, Home, End. Panels pair with aria-labelledby={`tab-${id}`}. */
export function PillTabs({ tabs, value, onChange, label }: { tabs: TabItem[]; value: string; onChange: (id: string) => void; label: string }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const idx = Math.max(0, tabs.findIndex((t) => t.id === value));
  function onKey(e: React.KeyboardEvent, i: number) {
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[n].id);
    refs.current[tabs[n].id]?.focus();
  }
  return (
    <div className="xc-tabs" role="tablist" aria-label={label} style={{ ["--n" as string]: tabs.length, ["--at" as string]: idx }}>
      <span className="xc-tabs-thumb" aria-hidden="true" />
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[t.id] = el; }}
          id={`tab-${t.id}`}
          role="tab"
          type="button"
          className="xc-tab"
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          <span className="xc-tab-n" aria-hidden="true">0{i + 1}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Feedback ---------- */
export function Check({ size = 22 }: { size?: number }) {
  return (
    <span className="xc-check" style={{ ["--sz" as string]: `${size}px` }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
        <path className="xc-check-path" d="M5.5 12.5l4.2 4.2L18.5 7.8" />
      </svg>
    </span>
  );
}

export function Busy({ label }: { label: string }) {
  return (
    <div role="status" className="xc-busy">
      <span className="xc-dots" aria-hidden="true"><i /><i /><i /></span>
      <span>{label}</span>
    </div>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "warn" | "info"; children: ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : undefined} className={cx("xc-notice", `is-${tone}`)}>
      {children}
    </p>
  );
}

export function Toast({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="xc-toast-region" aria-live="polite">
      <div className="xc-toast" role="status">
        <Check size={22} />
        <span>{children}</span>
        {onClose && <button type="button" className="xc-toast-x" onClick={onClose} aria-label="Dismiss">×</button>}
      </div>
    </div>
  );
}

/* ---------- Layout ---------- */
export type Tone = "white" | "soft" | "orange" | "yellow" | "green" | "lime" | "coral" | "sky" | "lilac" | "cream" | "ink";

/** Glass section on the navy app. `yellow` reads as an amber-edged caution tile, `lime` as a lit one. */
export function Tile({ tone = "soft", delay = 0, className, children, as: Tag = "section", ...rest }: { tone?: Tone; delay?: number; as?: "section" | "div" } & HTMLAttributes<HTMLElement>) {
  return (
    <Tag {...rest} style={{ ...stagger(delay), ...rest.style }} className={cx("xc-tile", `t-${tone}`, className)}>
      {children}
    </Tag>
  );
}

export function TileHead({ id, children, hint, kicker, aside }: { id: string; children: ReactNode; hint?: ReactNode; kicker?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="xc-thead">
      <div className="xc-thead-row">
        <div>
          {kicker && <p className="xc-kicker">{kicker}</p>}
          <h2 id={id} className="xc-h2">{children}</h2>
        </div>
        {aside}
      </div>
      {hint && <p className="xc-hint">{hint}</p>}
    </header>
  );
}

export function PageHead({ children, sentence, id }: { children: ReactNode; sentence: ReactNode; id?: string }) {
  return (
    <div className="xc-phead">
      <h1 id={id} className="xc-h1">{children}</h1>
      <p>{sentence}</p>
    </div>
  );
}

export function CopyPill({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      className={cx("xc-copy", done && "is-done")}
    >
      <span className="xc-copy-v">{shortId(value)}</span>
      <span className="xc-copy-a" aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** Technical details tucked away. `summary` is the closed label, e.g. "Proof" or "Details". */
export function Disclosure({ summary, children, className, defaultOpen }: { summary: string; children: ReactNode; className?: string; defaultOpen?: boolean }) {
  return (
    <details className={cx("xc-disc", className)} open={defaultOpen}>
      <summary>
        <span>{summary}</span>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square"><path d="m3 4.5 3 3 3-3" /></svg>
      </summary>
      <div className="xc-disc-body">{children}</div>
    </details>
  );
}

export function DemoBadge() {
  if (!USE_MOCKS) return null;
  return (
    <span title="Practice data from this browser. Nothing is saved to Walrus, Tatum or Sui." className="xc-demo">
      Demo data
    </span>
  );
}

export function Empty({ art, title, children, action }: { art?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; tone?: Tone }) {
  return (
    <div className="xc-empty">
      <span className="xc-empty-art" aria-hidden="true">{art ?? <OrbitGlyph size={56} />}</span>
      <p className="xc-empty-t">{title}</p>
      {children && <p className="xc-empty-b">{children}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="xc-skel" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} style={{ width: `${88 - i * 14}%` }} />
      ))}
    </div>
  );
}

/** Thin orbit-style countdown ring for the ~30 s relayer cutoff. `elapsed` in seconds. */
export function CutoffRing({ elapsed, total = 30 }: { elapsed: number; total?: number }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, elapsed / total));
  const left = Math.max(0, Math.ceil(total - elapsed));
  const over = elapsed >= total;
  const a = -Math.PI / 2 + p * 2 * Math.PI;
  return (
    <div className={cx("xc-ring", over && "is-over")}>
      <svg viewBox="0 0 112 112" width="156" height="156" aria-hidden="true">
        <circle cx="56" cy="56" r={r} className="xc-ring-bg" />
        <circle cx="56" cy="56" r={r} className="xc-ring-fg" strokeDasharray={c} strokeDashoffset={c * p} transform="rotate(-90 56 56)" />
        <circle cx={56 + r * Math.cos(a)} cy={56 + r * Math.sin(a)} r="3" className="xc-ring-sat" />
      </svg>
      <div className="xc-ring-c">
        <b>{over ? "Almost" : left}</b>
        <span>{over ? "still checking" : "seconds"}</span>
      </div>
    </div>
  );
}

export type Step = { label: string; state: "done" | "now" | "todo" };
export function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="xc-steps" aria-label="Visit progress">
      {steps.map((s, i) => (
        <li key={s.label} data-state={s.state} aria-current={s.state === "now" ? "step" : undefined}>
          <i aria-hidden="true">{s.state === "done" ? "✓" : `0${i + 1}`}</i>
          <span>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

/** Small brand mark: the white pixel-block X. */
export function BrandMark({ size = 24 }: { size?: number }) {
  return <XMark size={size} />;
}

/* ---------- Little hairline glyphs (decorative) ---------- */
export function Glyph({ kind, size = 40 }: { kind: "ticket" | "key" | "card" | "spark" | "receipt"; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 48 48", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 1.4, className: "xc-glyph" };
  if (kind === "ticket")
    return (
      <svg {...p}>
        <path d="M7 14h34v6a4 4 0 0 0 0 8v6H7v-6a4 4 0 0 0 0-8Z" />
        <path d="M30 15v18" strokeDasharray="2 3" />
      </svg>
    );
  if (kind === "key")
    return (
      <svg {...p}>
        <circle cx="16" cy="24" r="8" />
        <circle cx="16" cy="24" r="2.4" fill="currentColor" />
        <path d="M24 24h17M35 24v6M40 24v4" />
      </svg>
    );
  if (kind === "receipt")
    return (
      <svg {...p}>
        <path d="M12 6h24v36l-4-3-4 3-4-3-4 3-4-3-4 3Z" />
        <path d="M17 16h14M17 23h14M17 30h8" />
      </svg>
    );
  if (kind === "spark") return <OrbitGlyph size={size} lit />;
  return (
    <svg {...p}>
      <rect x="7" y="12" width="34" height="24" />
      <path d="M13 28h16M13 22h8" />
    </svg>
  );
}
