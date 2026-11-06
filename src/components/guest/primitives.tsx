import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";

export function cx(...a: Array<string | false | null | undefined>): string {
  return a.filter(Boolean).join(" ");
}

/* Button */
type ButtonBase = {
  /** primary = black pill, secondary = white pill with hairline, quiet = text, accent = green, lime = lime. */
  variant?: "primary" | "secondary" | "quiet" | "danger" | "accent" | "lime";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
};
export type ButtonProps = ButtonBase &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
export type LinkButtonProps = ButtonBase &
  Omit<React.ComponentProps<typeof Link>, "className"> & { className?: string };

function btnClass({ variant = "primary", size = "md", block, className }: ButtonBase & { className?: string }) {
  return cx(
    "g-btn",
    variant !== "primary" && `g-btn-${variant}`,
    size === "lg" && "g-btn-lg",
    size === "sm" && "g-btn-sm",
    block && "g-btn-block",
    className,
  );
}

export function Button({ variant, size, block, loading, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={btnClass({ variant, size, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="g-spinner" aria-hidden />}
      {children}
    </button>
  );
}
export function LinkButton({ variant, size, block, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={btnClass({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  );
}

/* Chip */
export type ChipTone = "sage" | "butter" | "coral" | "ink" | "lime" | "yellow" | "orange" | "sky" | "lilac" | "cream" | "green";
export type ChipProps = HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone; icon?: ReactNode };
export function Chip({ tone = "sage", icon, className, children, ...rest }: ChipProps) {
  return (
    <span className={cx("g-chip", tone !== "sage" && `g-chip-${tone}`, className)} {...rest}>
      {icon}
      {children}
    </span>
  );
}
/** Selectable chip (toggle). */
export function ChipButton({ pressed, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button type="button" aria-pressed={pressed} className={cx("g-chip", className)} {...rest}>
      {children}
    </button>
  );
}

/* StatusPill */
export type StatusPillProps = HTMLAttributes<HTMLSpanElement> & { status?: "shared" | "idle" | "revoked" | "warn" };
export function StatusPill({ status = "idle", className, children, ...rest }: StatusPillProps) {
  return (
    <span role="status" className={cx("g-pill", `g-pill-${status}`, className)} {...rest}>
      <span className="g-pill-dot" aria-hidden />
      {children}
    </span>
  );
}

/* Avatar */
export function Avatar({ name, size = 46, tone = "butter", className }: { name: string; size?: number; tone?: "butter" | "green" | "sage"; className?: string }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className={cx("g-avatar", tone !== "butter" && `g-avatar-${tone}`, className)}
      style={{ ["--sz" as string]: `${size}px` }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

/* SectionTitle: wrap one word in *asterisks* to give it the lime marker accent. */
export function SectionTitle({
  children,
  eyebrow,
  as: Tag = "h2",
  size = "h1",
  lead,
  className,
  align = "start",
}: {
  children: string;
  eyebrow?: string;
  as?: "h1" | "h2" | "h3";
  size?: "display" | "h1" | "h2";
  lead?: ReactNode;
  className?: string;
  /** "center" centres the block (reference hero headline). */
  align?: "start" | "center";
}) {
  const parts = children.split(/\*([^*]+)\*/g);
  return (
    <div className={cx("g-section-title", align === "center" && "g-center", className)}>
      {eyebrow && <span className="g-eyebrow">{eyebrow}</span>}
      <Tag className={`g-${size}`}>
        {parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : p))}
      </Tag>
      {lead && <p className="g-lead">{lead}</p>}
    </div>
  );
}

/* Card */
export type CardTone = "green" | "lime" | "yellow" | "orange" | "coral" | "sky" | "lilac" | "cream" | "ink";
export function Card({
  variant = "default",
  lift,
  tone,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "flat" | "paper" | "stitched";
  lift?: boolean;
  /** Vivid card colour (pricing / featured cards). Omit for a white card. */
  tone?: CardTone;
}) {
  return (
    <div
      className={cx(
        "g-card",
        variant === "flat" && "g-card-flat",
        variant === "paper" && "g-card-paper",
        variant === "stitched" && "g-stitched",
        lift && "g-card-lift",
        tone && `g-tone-${tone}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* Note (coral "Important to know") */
export function Note({ title = "Important to know", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="g-note" role="note">
      <span className="g-note-title">{title}</span>
      {children}
    </div>
  );
}

/* Rows (hairline separated) */
export function Rows({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="g-rows">
      {items.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Divider() {
  return <hr className="g-divider" />;
}

/* Fields */
type FieldShared = { label: string; hint?: string; error?: string; id: string };
export function Field({ label, hint, error, id, className, ...rest }: FieldShared & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="g-field">
      <label className="g-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className={cx("g-input", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
        {...rest}
      />
      {error ? <span id={`${id}-e`} className="g-error">{error}</span> : hint ? <span id={`${id}-h`} className="g-hint">{hint}</span> : null}
    </div>
  );
}
export function TextArea({ label, hint, error, id, className, ...rest }: FieldShared & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="g-field">
      <label className="g-label" htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className={cx("g-textarea", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
        {...rest}
      />
      {error ? <span id={`${id}-e`} className="g-error">{error}</span> : hint ? <span id={`${id}-h`} className="g-hint">{hint}</span> : null}
    </div>
  );
}

/* Stamp */
export function Stamp({ children = "Shared · this visit only", animate = true, tone = "green", className }: { children?: ReactNode; animate?: boolean; tone?: "green" | "coral"; className?: string }) {
  return (
    <span className={cx("g-stamp", animate && "g-stamp-animate", tone === "coral" && "g-stamp-revoked", className)}>
      {children}
    </span>
  );
}

/* Toast */
export function Toast({ children, tone = "success", onClose }: { children: ReactNode; tone?: "success" | "error"; onClose?: () => void }) {
  return (
    <div className={cx("g-toast", tone === "error" && "g-toast-error")} role={tone === "error" ? "alert" : "status"}>
      <span className="g-toast-check" aria-hidden>{tone === "error" ? "!" : "✓"}</span>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="g-toast-close" onClick={onClose} aria-label="Dismiss">×</button>
      )}
    </div>
  );
}
export function ToastRegion({ children }: { children: ReactNode }) {
  return <div className="g-toast-region" aria-live="polite">{children}</div>;
}

/* HandleTag: green speech-bubble handle, e.g. "@maya" */
export function HandleTag({ children, tone = "green", className }: { children: ReactNode; tone?: "green" | "ink" | "lime"; className?: string }) {
  return <span className={cx("g-handle", tone !== "green" && `g-handle-${tone}`, className)}>{children}</span>;
}

/* Marquee: yellow scrolling band. Static under prefers-reduced-motion. */
export function Marquee({ items, className, label }: { items: string[]; className?: string; label?: string }) {
  return (
    <div className={cx("g-marquee", className)} role="region" aria-label={label ?? items.join(", ")}>
      <div className="g-marquee-track">
        <span>{items.map((t) => <span key={t}>{t}</span>)}</span>
        <span aria-hidden="true">{items.map((t) => <span key={t}>{t}</span>)}</span>
      </div>
    </div>
  );
}

/* CardFan: overlapping, tilted cards (reference hero). Children are the cards. */
export function CardFan({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("g-fan", className)}>{children}</div>;
}
