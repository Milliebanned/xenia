"use client";
import { useRef, useState } from "react";
import * as api from "@/app/lib-client/api";
import { CUSTOMER_KIND_LABEL, displayHeadline } from "@/lib/display";
import type { FactKind, ProfileFact, Suggestion } from "@/lib/types";
import { buildCardData, factBody, factDate } from "./card-data";
import { PassCard } from "./PassCard";
import { shopName } from "./shop-name";
import { Btn, Bubble, Busy, CopyPill, Disclosure, Empty, Notice, Skeleton, Tile, TileHead, cx, stagger } from "./ui";

const EXAMPLES = [
  { label: "My usual cut", text: "Usual: skin fade, number 2 on the sides." },
  { label: "My car", text: "Drives a 2016 Corolla, synthetic oil, no upsells." },
  { label: "An allergy", text: "Allergic to penicillin." },
  { label: "Hems", text: "Trousers hemmed 1cm shorter than standard." },
  { label: "Early slots", text: "Prefers 6am slots, towel service." },
  { label: "Call me…", text: "Call me Maya." },
  { label: "Pay on Fridays", text: "I settle my tab on Fridays." },
];

/** Accent per kind of note: only "Important" gets the amber edge. */
const KIND_TONE: Record<FactKind, string> = {
  order: "usual",
  allergy: "imp",
  nickname: "name",
  preference: "note",
  payment_habit: "pay",
};

/**
 * The guest card in the beam header, plus "Show my card". Lives in the page header so the beam can light it.
 */
export function CardHero({
  facts, liveShop, onShowCard,
}: {
  facts: ProfileFact[] | null;
  liveShop: string | null;
  onShowCard: () => void;
}) {
  const data = buildCardData(facts);
  const focusComposer = () => {
    const el = document.getElementById("learn") as HTMLTextAreaElement | null;
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  return (
    <div className="xc-hero" style={stagger(0)}>
      <PassCard
        id="guest-card"
        data={data}
        state={facts === null ? "loading" : !data ? "empty" : liveShop ? "shared" : "ready"}
        sharedWith={liveShop ? shopName(liveShop) : undefined}
        emptyAction={<Btn onClick={focusComposer} arrow>Add the first thing</Btn>}
      />
      {data && (
        <div className="xc-hero-cta">
          <Btn size="lg" block arrow onClick={onShowCard} id="show-my-card" aria-haspopup="dialog">
            Show my card
          </Btn>
          <p className="xc-fine xc-center">Hold it up to anyone, even a shop that has never heard of Xenia.</p>
        </div>
      )}
    </div>
  );
}

export function MyCard({
  facts, error, suggestions, onLearned,
}: {
  facts: ProfileFact[] | null;
  error: string | null;
  suggestions: Suggestion[];
  onLearned: (f: ProfileFact[]) => void;
}) {
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const data = buildCardData(facts);
  const count = facts?.filter((f) => f.status !== "failed").length ?? 0;
  return (
    <>
      <Composer onLearned={onLearned} textareaRef={composerRef} started={!!data} />
      <Facts facts={facts} error={error} count={count} />
      <Why suggestions={suggestions} />
    </>
  );
}

function Composer({ onLearned, textareaRef, started }: { onLearned: (f: ProfileFact[]) => void; textareaRef: React.RefObject<HTMLTextAreaElement | null>; started: boolean }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      onLearned(await api.learn(text.trim()));
      setText("");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Tile tone="soft" aria-labelledby="learn-h" delay={1} className="xc-composer">
      <TileHead id="learn-h" hint="Say it the way you would out loud. Xenia turns it into short notes on your card.">
        {started ? "Add to your card" : "Start your card"}
      </TileHead>
      <form onSubmit={submit} className="xc-form">
        <label htmlFor="learn" className="xc-sr">Describe how you like things</label>
        <textarea
          id="learn"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Skin fade, number 2 on the sides. Allergic to penicillin. Call me Maya."
          className="xc-input"
        />
        <div className="xc-examples" role="group" aria-label="Ideas you can add">
          {EXAMPLES.map((x) => (
            <button key={x.label} type="button" className="xc-eg" onClick={() => setText((t) => (t.trim() ? `${t.trim()} ${x.text}` : x.text))}>
              <span aria-hidden="true">+</span> {x.label}
            </button>
          ))}
        </div>
        {err && <Notice>{err}</Notice>}
        <div className="xc-formrow">
          <p className="xc-fine">Saving can take about 30 seconds. You can keep going.</p>
          <Btn type="submit" loading={busy} disabled={!text.trim()} arrow>Remember this</Btn>
        </div>
      </form>
    </Tile>
  );
}

function StatusMark({ f }: { f: ProfileFact }) {
  if (f.status === "saving")
    return <Bubble tone="yellow" live className="xc-st is-saving is-pulse">Saving</Bubble>;
  if (f.status === "saved")
    return <Bubble tone="green" className="xc-st is-saved">Saved</Bubble>;
  return <Bubble tone="coral" live className="xc-st is-failed">Not saved</Bubble>;
}

function Facts({ facts, error, count }: { facts: ProfileFact[] | null; error: string | null; count: number }) {
  return (
    <Tile tone="white" aria-labelledby="facts-h" delay={2} className="xc-facts-tile">
      <TileHead
        id="facts-h"
        aside={facts && facts.length > 0 ? <span className="xc-count" aria-hidden="true">{count}</span> : undefined}
        hint={facts && facts.length > 0 ? `${count} ${count === 1 ? "thing" : "things"} on your card, each kept privately for you.` : "Everything you tell Xenia lands here, in plain words."}
      >
        What’s on your card
      </TileHead>
      {error && <Notice tone="warn">We couldn’t refresh just now. {error}</Notice>}
      {facts === null && !error && (
        <>
          <Busy label="Opening your card" />
          <Skeleton rows={3} />
        </>
      )}
      {facts?.length === 0 && (
        <Empty title="Nothing here yet">
          Add your first note above. It shows up here and on your card.
        </Empty>
      )}
      <ul className="xc-facts">
        {facts?.map((f, i) => {
          const date = factDate(f.text, f.createdAt);
          return (
            <li key={f.localId} style={stagger(Math.min(i, 8))} className={cx("xc-fact", `is-${f.status}`, `k-${KIND_TONE[f.kind]}`)}>
              <div className="xc-fact-top">
                <span className="xc-kind">{CUSTOMER_KIND_LABEL[f.kind]}</span>
                <StatusMark f={f} />
              </div>
              <p className="xc-fact-text">{factBody(f.text)}</p>
              {date && <p className="xc-date">{date}</p>}
              {f.status === "failed" && (
                <p className="xc-retry">{f.error ?? "That one didn’t save. Nothing was lost. Tell Xenia again and it will try once more."}</p>
              )}
              {f.status === "saved" && f.blobId && (
                <Disclosure summary="Proof" className="xc-proof">
                  <p>Stored privately on Walrus. This is its receipt.</p>
                  <div className="xc-proof-row"><span>Walrus blob</span><CopyPill value={f.blobId} label="Walrus blob id" /></div>
                </Disclosure>
              )}
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}

function Why({ suggestions }: { suggestions: Suggestion[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Tile tone="soft" aria-labelledby="why-h" delay={3} className="xc-why">
      <TileHead id="why-h" hint="Xenia only suggests things you told it, and always shows the notes behind it.">
        Why am I seeing this?
      </TileHead>
      {suggestions.length === 0 ? (
        <Empty title="Nothing to suggest yet">
          Once a few notes are saved, Xenia points out what it noticed and shows you exactly why.
        </Empty>
      ) : (
        <ul className="xc-sugg">
          {suggestions.map((s, i) => {
            const isOpen = open === s.id;
            return (
              <li key={s.id} style={stagger(i)} className="xc-sugg-i">
                <p className="xc-sugg-h">{displayHeadline(s)}</p>
                <button type="button" className="xc-more" aria-expanded={isOpen} aria-controls={`why-${s.id}`} onClick={() => setOpen(isOpen ? null : s.id)}>
                  {isOpen ? "Hide the reason" : "Why am I seeing this?"}
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square"><path d="m3 4.5 3 3 3-3" /></svg>
                </button>
                <div id={`why-${s.id}`} className={cx("xc-expand", isOpen && "is-open")} inert={!isOpen}>
                  <ul className="xc-evi">
                    {s.because.map((b) => (
                      <li key={b.blobId} className={cx(b.superseded && "is-old")}>
                        <q>{factBody(b.text)}</q>
                        <span className="xc-evi-m">
                          You told us this{factDate(b.text, b.createdAt) ? ` on ${factDate(b.text, b.createdAt)}` : ""}. Match {Math.round((1 - b.distance) * 100)}%.
                          {b.superseded && <b className="xc-old-tag">Replaced by a newer note</b>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Tile>
  );
}
