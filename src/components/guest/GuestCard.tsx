import type { CSSProperties, ReactNode } from "react";
import { Avatar, HandleTag, Note, Stamp, StatusPill, cx, type CardTone } from "./primitives";
import { HandCard } from "./Illustrations";

export type GuestCardData = {
  name: string;
  goesBy?: string;
  usual?: string;
  pay?: string;
  notes?: string;
  important?: string;
};
export type GuestCardState = "ready" | "loading" | "empty" | "shared" | "revoked";
export type GuestCardTone = CardTone;

export type GuestCardProps = {
  data?: GuestCardData;
  /** compact (lists, previews), full (default), large / "counter-large" (shown across the counter). */
  variant?: "full" | "compact" | "large" | "counter-large";
  state?: GuestCardState;
  /** Business name, shown in the footer when state is shared / revoked. */
  sharedWith?: string;
  /** Replaces the default footer status text. */
  footer?: ReactNode;
  /** Shown in the empty state. */
  emptyAction?: ReactNode;
  className?: string;
  /** Card colour. Default "orange" (the reference's featured card). */
  tone?: GuestCardTone;
  /** Framed illustration or photo at the top of the card (img, svg, Illustrations). */
  art?: ReactNode;
  /** Green speech-bubble handle tag, e.g. "@maya". */
  handle?: string;
  /** Resting tilt in degrees (for fans / hero placement). Ignored under reduced motion on hover only. */
  tilt?: number;
};

export function GuestCard({
  data,
  variant = "full",
  state = "ready",
  sharedWith,
  footer,
  emptyAction,
  className,
  tone = "orange",
  art,
  handle,
  tilt,
}: GuestCardProps) {
  const large = variant === "large" || variant === "counter-large";
  const wrap = cx(
    "g-pass-wrap",
    `g-tone-${tone}`,
    large && "g-pass-large",
    variant === "compact" && "g-pass-compact",
    state === "revoked" && "g-pass-revoked",
    state === "loading" && "g-pass-loading",
    state === "shared" && "g-pass-shared",
    className,
  );
  const style = tilt ? ({ ["--tilt" as string]: `${tilt}deg` } as CSSProperties) : undefined;

  const artBlock = (content: ReactNode) =>
    content || handle ? (
      content ? (
        <div className="g-pass-art">
          {content}
          {handle && <HandleTag className="g-pass-handle">{handle}</HandleTag>}
        </div>
      ) : (
        <HandleTag className="g-pass-handle-inline">{handle}</HandleTag>
      )
    ) : null;

  if (state === "loading") {
    return (
      <div className={wrap} style={style} aria-busy="true" aria-label="Loading your Xenia card">
        <article className="g-pass">
          <span className="g-skel" style={{ aspectRatio: variant === "compact" ? "16 / 9" : "4 / 3", borderRadius: 18 }} />
          <div style={{ display: "grid", gap: 8, padding: "4px 8px" }}>
            <span className="g-skel" style={{ height: 10, width: "35%" }} />
            <span className="g-skel" style={{ height: 22, width: "65%" }} />
          </div>
          <div className="g-pass-panel" style={{ paddingTop: 16 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="g-skel" style={{ height: 12, width: `${90 - i * 14}%` }} />
            ))}
          </div>
          <span className="g-skel" style={{ height: 34, width: "60%", borderRadius: 999, margin: "0 4px 4px" }} />
        </article>
      </div>
    );
  }

  if (state === "empty" || !data) {
    return (
      <div className={wrap} style={style}>
        <article className="g-pass g-empty" aria-label="Your Xenia card is empty">
          {artBlock(art ?? <HandCard size={variant === "compact" ? 72 : 110} />)}
          <h3 className="g-h2" style={{ marginTop: 4 }}>Tell Xenia how you like things</h3>
          <p>Your usual, how you pay, anything worth knowing. It takes a minute and stays yours.</p>
          {emptyAction}
        </article>
      </div>
    );
  }

  const rows = [
    data.usual ? { k: "Your usual", v: data.usual } : null,
    data.pay ? { k: "How you pay", v: data.pay } : null,
  ].filter((r): r is { k: string; v: string } => r !== null);

  const status =
    state === "shared" ? (
      <StatusPill status="shared">{footer ?? (sharedWith ? `Shared with ${sharedWith} until you leave` : "Shared for this visit")}</StatusPill>
    ) : state === "revoked" ? (
      <StatusPill status="revoked">{footer ?? (sharedWith ? `${sharedWith} can no longer see this` : "Access taken back")}</StatusPill>
    ) : (
      <StatusPill status="idle">{footer ?? "Not shared"}</StatusPill>
    );

  const hasPanel = rows.length > 0 || data.notes || data.important;

  return (
    <div className={wrap} style={style}>
      <article className="g-pass" aria-label={`Xenia card for ${data.name}`}>
        {artBlock(art)}
        <div className="g-pass-top">
          {!art && <Avatar name={data.name} size={large ? 64 : variant === "compact" ? 38 : 46} />}
          <div>
            <span className="g-pass-kicker">Xenia card</span>
            <span className="g-pass-name">{data.name}</span>
            {data.goesBy && <span className="g-pass-goes">Goes by {data.goesBy}</span>}
          </div>
        </div>
        {hasPanel && (
          <div className="g-pass-panel">
            {rows.length > 0 && (
              <dl className="g-rows">
                {rows.map((r) => (
                  <div key={r.k}>
                    <dt>{r.k}</dt>
                    <dd>{r.v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {data.notes && (
              <div className="g-pass-notes">
                <span className="g-pass-notes-k">Notes</span>
                {data.notes}
              </div>
            )}
            {data.important && <Note>{data.important}</Note>}
          </div>
        )}
        <div className="g-pass-foot">
          {status}
          {state === "shared" && (
            <span className="g-pass-stamp" aria-hidden>
              <Stamp>This visit only</Stamp>
            </span>
          )}
        </div>
      </article>
    </div>
  );
}
