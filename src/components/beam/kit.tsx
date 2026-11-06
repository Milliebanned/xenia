"use client";
/**
 * Beam kit primitives shared by /customer, /shop and /proof. Presentational only: nothing here talks to the network.
 * Styles: ./beam.css, scoped to an `.xb` root.
 */
import "./beam.css";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { BeamCanvas } from "./BeamCanvas";

export function cx(...a: Array<string | false | null | undefined>): string {
  return a.filter(Boolean).join(" ");
}

/** White pixel-block X mark, the same mark as the landing. */
export function XMark({ size = 24 }: { size?: number }) {
  const cells = [
    [0, 0], [1, 1], [3, 0], [2, 1],
    [1, 2], [2, 2], [0, 3], [3, 3],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 4 4" shapeRendering="crispEdges" aria-hidden="true" className="xb-mark">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
      <rect x="1.5" y="1.5" width="1" height="1" fill="currentColor" />
    </svg>
  );
}

/** Pixel mark plus the lowercase wordmark. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="xb-wordmark">
      <XMark size={size} />
      <span>xenia</span>
    </span>
  );
}

export function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className="xb-arrow">
      <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}

export type BtnTone = "white" | "ghost" | "glass" | "navy" | "danger";
export type KitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: BtnTone;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
  arrow?: boolean;
};

/** Sharp-cornered button. White with an arrow is the main action, as in the reference. */
export function Button({ tone = "white", size = "md", block, loading, arrow, className, children, disabled, type = "button", ...rest }: KitButtonProps) {
  return (
    <button
      type={type}
      className={cx("xb-btn", `is-${tone}`, size !== "md" && `is-${size}`, block && "is-block", arrow && !loading && "has-arrow", className)}
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

/** Link styled as a sharp button. */
export function ButtonLink({ tone = "white", size = "md", arrow = true, className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { tone?: BtnTone; size?: "sm" | "md" | "lg"; arrow?: boolean }) {
  return (
    <a className={cx("xb-btn", `is-${tone}`, size !== "md" && `is-${size}`, arrow && "has-arrow", className)} {...rest}>
      <span>{children}</span>
      {arrow && <ArrowRight />}
    </a>
  );
}

export type PillTone = "live" | "ok" | "warn" | "bad" | "muted" | "solid" | "plain";
/** Small sharp status tag with a dot. Colour is never the only signal: the label carries it. */
export function Pill({ tone = "plain", children, className, live, pulse, dot = true }: { tone?: PillTone; children: ReactNode; className?: string; live?: boolean; pulse?: boolean; dot?: boolean }) {
  return (
    <span className={cx("xb-pill", `is-${tone}`, pulse && "is-pulse", className)} role={live ? "status" : undefined}>
      {dot && <i aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Decorative orbit mark for empty states: hairline ellipses around a point. */
export function OrbitGlyph({ size = 64, lit = false }: { size?: number; lit?: boolean }) {
  return (
    <svg className="xb-orbit-glyph" width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="34" cy="32" rx="26" ry="12" stroke="currentColor" strokeOpacity="0.45" />
      <ellipse cx="30" cy="32" rx="17" ry="22" stroke="currentColor" strokeOpacity="0.3" transform="rotate(-8 30 32)" />
      <circle cx="58" cy="29" r="1.8" fill="currentColor" />
      <circle cx="22" cy="12" r="1.5" fill="currentColor" fillOpacity="0.7" />
      {lit && <path d="M14 32 L64 27 L64 37 Z" fill="currentColor" fillOpacity="0.18" />}
      <circle cx="14" cy="32" r={lit ? 3.6 : 3} fill={lit ? "currentColor" : "none"} stroke="currentColor" />
    </svg>
  );
}

/**
 * The share link drawn as light: you (the bright point) on the left, the shop as a satellite on the right.
 * `level` 1 = shared, lower while taking it back, 0 = off.
 */
export function BeamLink({ to, level, youLabel = "You" }: { to: string; level: number; youLabel?: string }) {
  return (
    <div className={cx("xb-link", level < 0.05 && "is-off")} aria-hidden="true">
      <BeamCanvas level={level} origin={[0.12, 0.42]} originMobile={[0.12, 0.42]} orbitScale={0.5} spread={0.42} />
      <span className="xb-link-you">{youLabel}</span>
      <span className="xb-link-to"><i /><span>{to}</span></span>
    </div>
  );
}

export { BeamCanvas };
