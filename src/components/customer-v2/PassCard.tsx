import type { ReactNode } from "react";
import { XMark } from "@/components/beam";
import type { CardData } from "./card-data";
import { Bubble, cx } from "./ui";

export type PassState = "loading" | "empty" | "ready" | "shared";

/**
 * The guest card: a frosted dark glass card, lit from behind by the beam. Built only from the user's own facts.
 * `xl` is the full-screen "Show my card" size.
 */
export function PassCard({
  data, state = "ready", sharedWith, size = "md", emptyAction, footer, id,
}: {
  data: CardData | null;
  state?: PassState;
  sharedWith?: string;
  size?: "md" | "xl";
  emptyAction?: ReactNode;
  footer?: ReactNode;
  id?: string;
}) {
  if (state === "loading") {
    return (
      <div className={cx("xc-pass-stack", size === "xl" && "is-xl")} aria-busy="true" aria-label="Loading your guest card">
        <article className="xc-pass is-loading">
          <span className="xc-sk" style={{ width: "34%", height: 10 }} />
          <span className="xc-sk" style={{ width: "58%", height: 34, marginTop: 18 }} />
          <span className="xc-sk" style={{ width: "86%", marginTop: 26 }} />
          <span className="xc-sk" style={{ width: "70%" }} />
          <span className="xc-sk" style={{ width: "40%", height: 24, marginTop: 18 }} />
        </article>
      </div>
    );
  }

  if (state === "empty" || !data) {
    return (
      <div className={cx("xc-pass-stack", "is-empty", size === "xl" && "is-xl")}>
        <article className="xc-pass xc-pass-empty">
          <div className="xc-pass-top">
            <span className="xc-pass-kicker"><XMark size={12} /> Guest card</span>
            <Bubble tone="soft">New card</Bubble>
          </div>
          <p className="xc-pass-name is-empty-name">Your card is blank</p>
          <p className="xc-pass-empty-b">Add your usual, how you pay, anything worth knowing. It takes a minute and it stays yours.</p>
          {emptyAction}
        </article>
      </div>
    );
  }

  const shared = state === "shared";
  const rows = [
    data.usual ? { k: "Your usual", v: data.usual } : null,
    data.pay ? { k: "How you pay", v: data.pay } : null,
    data.notes ? { k: "Note", v: data.notes } : null,
  ].filter((r): r is { k: string; v: string } => r !== null);

  return (
    <div className={cx("xc-pass-stack", shared && "is-shared", size === "xl" && "is-xl")}>
      <article id={id} className={cx("xc-pass", shared && "is-shared")} aria-label={`${data.named ? `${data.name}’s` : "Your"} guest card`}>
        <div className="xc-pass-top">
          <span className="xc-pass-kicker"><XMark size={12} /> Guest card</span>
          {data.named && <span className="xc-pass-handle">@{data.name.toLowerCase().replace(/\s+/g, "")}</span>}
        </div>
        <p className="xc-pass-name">{data.named ? data.name : "How I like things"}</p>
        {rows.length > 0 && (
          <dl className="xc-pass-rows">
            {rows.map((r) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        )}
        {data.important && (
          <div className="xc-pass-imp" role="note">
            <span className="xc-pass-imp-k">Important to know</span>
            <span>{data.important}</span>
          </div>
        )}
        <div className="xc-pass-foot">
          {footer ?? (
            shared ? (
              <Bubble tone="ink" live>Shared with {sharedWith ?? "a shop"}</Bubble>
            ) : (
              <Bubble tone="soft">Not shared</Bubble>
            )
          )}
          {shared && <span className="xc-pass-only">This visit only</span>}
        </div>
      </article>
    </div>
  );
}
