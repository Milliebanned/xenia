"use client";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { USE_MOCKS } from "@/app/lib-client/api";
import type { SaveStatus } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "ghost" | "danger" | "quiet";
export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const styles: Record<Variant, string> = {
    primary: "bg-clay text-white hover:bg-[#8c3615]",
    ghost: "border border-line bg-card text-ink hover:bg-paper2",
    quiet: "text-soft hover:text-ink hover:bg-paper2",
    danger: "bg-rose text-white hover:bg-[#861d20]",
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest} className={cx("rounded-3xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(43,36,32,0.03)] sm:p-6", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.14em] text-soft">{eyebrow}</p>}
      <h2 className="font-serif text-2xl leading-tight">{children}</h2>
    </div>
  );
}

const chip = {
  saving: { cls: "bg-ambersoft text-amber", label: "Saving" },
  saved: { cls: "bg-mosssoft text-moss", label: "Saved" },
  failed: { cls: "bg-rosesoft text-rose", label: "Failed" },
} as const;

export function StatusChip({ status }: { status: SaveStatus }) {
  const c = chip[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", c.cls)}>
      <span
        aria-hidden
        className={cx("size-1.5 rounded-full bg-current", status === "saving" && "anim-shimmer")}
      />
      {c.label}
    </span>
  );
}

/** Shown on every page while mocks are on. Never hide it. */
export function DemoBadge({ className }: { className?: string }) {
  if (!USE_MOCKS) return null;
  return (
    <span
      title="Mock data from the browser, not Walrus, Tatum or Sui"
      className={cx(
        "inline-flex items-center rounded-full border border-amber/40 bg-ambersoft px-2.5 py-0.5 text-xs font-medium text-amber",
        className,
      )}
    >
      Demo data
    </span>
  );
}

export function shortId(id: string, head = 6, tail = 4) {
  return id.length <= head + tail + 1 ? id : `${id.slice(0, head)}…${id.slice(-tail)}`;
}

export function CopyChip({ value, label }: { value: string; label: string }) {
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
      className="inline-flex min-h-7 items-center gap-1.5 rounded-md bg-paper2 px-2 font-mono text-xs text-soft hover:text-ink"
    >
      {shortId(value)}
      <span aria-live="polite">{done ? "copied" : "copy"}</span>
    </button>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("font-serif text-xl tracking-tight", className)}>
      Xenia<span className="text-clay">.</span>
    </span>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-soft">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-clay" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-rosesoft px-3 py-2 text-sm text-rose">
      {children}
    </p>
  );
}
