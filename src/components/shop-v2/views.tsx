"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import * as api from "@/app/lib-client/api";
import { displayHeadline } from "@/lib/display";
import type { ShopProfile, ShopState } from "@/app/lib-client/api";
import { Button } from "@/components/beam";

export const PRESETS = [
  { label: "Haircut", amount: "4.50" },
  { label: "Repeat prescription", amount: "3.20" },
  { label: "Weekly basket", amount: "3.00" },
];

const shortId = (id: string, head = 10, tail = 6) => (id.length <= head + tail + 1 ? id : `${id.slice(0, head)}…${id.slice(-tail)}`);

export function Err({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="xs-err">
      {children}
    </p>
  );
}

export function CopyValue({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="xs-copy"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
    >
      <span className="xs-copy-v">{shortId(value)}</span>
      <b aria-live="polite">{done ? "Copied" : "Copy"}</b>
    </button>
  );
}

/** Waiting state: a big ask on the left, the QR on the right in a white frame where the beam lands. */
export function Waiting({ qr, err }: { qr: string; err: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(qr, { margin: 1, width: 720, errorCorrectionLevel: "L", color: { dark: "#050b2a", light: "#ffffff" } }).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [qr]);
  return (
    <div className="xs-wait">
      <div className="xs-wait-copy">
        <p className="xb-kicker">Visit code ready</p>
        <h1 className="xs-h1 xs-h1-xl">Ask the guest to scan</h1>
        <p className="xs-lead">They choose what to share, just for this visit.</p>
        <p className="xs-listen" role="status">
          <span className="xs-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          Waiting for them to say hello
        </p>
        <div className="xs-code">
          <span>Visit code</span> <CopyValue value={qr} label="visit code" />
        </div>
        <details className="xs-details">
          <summary>Show the full text</summary>
          <p>{qr}</p>
        </details>
        {err && <Err>{err}</Err>}
      </div>
      <div className="xs-ticket-wrap">
        <figure className="xs-ticket">
          <figcaption className="xs-ticket-top">
            <span>Visit card</span>
            <span>For today only</span>
          </figcaption>
          <div className="xs-ticket-qr">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="QR code. Scan with Xenia to grant this visit." width={720} height={720} />
            ) : (
              <div className="xs-qr-skel" />
            )}
          </div>
          <p className="xs-ticket-foot">Open Xenia on your phone and point it here.</p>
        </figure>
      </div>
    </div>
  );
}

/** Thin orbit-style ring with one segment per open item. Clear tab = calm full mint ring with a tick. */
function TabRing({ state }: { state: ShopState }) {
  const open = Number(state.openTotalUsdc) > 0;
  const n = Math.min(Math.max(state.tab.length, 1), 24);
  const r = 100;
  const c = 2 * Math.PI * r;
  const gap = n === 1 ? 0 : Math.min(14, (c / n) * 0.2);
  // satellite at the start of the ring, where the next item will land
  return (
    <div className="xs-ringcard">
      <div className={`xs-ring ${open ? "is-open" : "is-clear"}`}>
        <svg viewBox="0 0 240 240" aria-hidden>
          <ellipse cx="120" cy="120" rx="116" ry="44" className="xs-ring-orbit" transform="rotate(-18 120 120)" />
          <circle cx="120" cy="120" r={r} className="xs-ring-track" />
          <circle
            className="xs-ring-seg"
            cx="120"
            cy="120"
            r={r}
            strokeDasharray={open ? `${c / n - gap} ${gap}` : undefined}
            transform="rotate(-90 120 120)"
          />
          <circle cx="120" cy={120 - r} r="4.5" className="xs-ring-sat" />
        </svg>
        <div className="xs-ring-mid">
          {open ? (
            <>
              <span className="xs-ring-amt">{state.openTotalUsdc}</span>
              <span className="xs-ring-unit">USDC open</span>
            </>
          ) : (
            <svg viewBox="0 0 64 64" width="52" height="52" fill="none" aria-hidden>
              <path d="M17 33l10 10 21-23" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
            </svg>
          )}
        </div>
      </div>
      <div>
        <p className={`xs-tabstate ${open ? "is-open" : "is-clear"}`}>{open ? `Tab open · ${state.openTotalUsdc} USDC` : "Tab clear"}</p>
        <p className="xs-small">{open ? `${state.tab.length} open item${state.tab.length === 1 ? "" : "s"}` : "Nothing owed"}</p>
      </div>
    </div>
  );
}

export function ProfileView({ profile, state }: { profile: ShopProfile; state: ShopState }) {
  const name = profile.nickname ?? "Guest";
  return (
    <div className="xs-active">
      <section className="xs-guest" aria-label="Guest profile">
        <header className="xs-guest-top">
          <span className="xs-avatar" aria-hidden>
            {(name.trim()[0] ?? "?").toUpperCase()}
          </span>
          <div>
            <p className="xs-welcome">Welcome back,</p>
            <h1 className="xs-nick">{name}</h1>
          </div>
        </header>

        <section className="xs-usual" aria-label="Their usual">
          <p className="xs-label">Their usual</p>
          <p className="xs-usual-v">{profile.usualOrder ?? "No usual shared yet"}</p>
        </section>

        {profile.allergies.length > 0 && (
          <div role="alert" className="xs-allergy">
            <p className="xs-allergy-label">
              <span className="xs-allergy-badge" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
                  <path d="M12 3 2 21h20L12 3Z" />
                  <path d="M12 10v5M12 18v.5" />
                </svg>
              </span>
              Important to know
            </p>
            <ul>
              {profile.allergies.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {(profile.notes.length > 0 || profile.howTheyPay.length > 0) && (
          <ul className="xs-notes" aria-label="Notes">
            {profile.notes.map((n) => (
              <li key={n}>
                <b>Notes</b>
                <span>{n}</span>
              </li>
            ))}
            {profile.howTheyPay.map((n) => (
              <li key={n}>
                <b>How they pay</b>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}

        {state.suggestions.length > 0 && (
          <ul className="xs-sugg">
            {state.suggestions.map((g) => (
              <li key={g.id}>
                <span className="xs-sugg-tag">Suggestion</span>
                <span>{displayHeadline(g, "shop")}</span>
              </li>
            ))}
          </ul>
        )}

        {state.facts.length === 0 && (
          <p className="xs-nofacts" role="status">
            {state.recallError ? `Profile read failed: ${state.recallError}` : "Nothing shared with this counter yet. They may still be setting up their card."}
          </p>
        )}

        <footer className="xs-guest-foot">
          <span role="status" className="xs-shared">
            <i aria-hidden />
            Shared with you for this visit only
          </span>
        </footer>
      </section>

      <aside className="xs-side" aria-label="Tab">
        <section className="xs-panel xs-panel-ring" aria-label="Tab status">
          <TabRing state={state} />
        </section>
        <TabPanel state={state} />
      </aside>
    </div>
  );
}

export function TabPanel({ state }: { state: ShopState }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { customerAccountId, shopId } = state.visit.session;

  async function add(a: string, n: string) {
    setBusy(true);
    setErr(null);
    try {
      await api.addCharge(customerAccountId, shopId, a, n || undefined);
      setAmount("");
      setNote("");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not add to tab");
    } finally {
      setBusy(false);
    }
  }
  const valid = /^\d+(\.\d{1,2})?$/.test(amount) && Number(amount) > 0;
  return (
    <section aria-labelledby="tabp-h" className="xs-panel xs-tabpanel">
      <h2 id="tabp-h" className="xs-h2">
        Add to tab
      </h2>
      <div className="xs-presets">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="xs-preset" disabled={busy} onClick={() => add(p.amount, p.label)}>
            <span>{p.label}</span>
            <b>{p.amount}</b>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) void add(amount, note);
        }}
        className="xs-form"
      >
        <div className="xs-form-row">
          <label className="xs-sr" htmlFor="note">
            Item
          </label>
          <input id="note" className="xs-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Item" />
          <label className="xs-sr" htmlFor="amt">
            Amount in USDC
          </label>
          <input id="amt" className="xs-input xs-amt" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
        </div>
        <Button type="submit" disabled={!valid} loading={busy} block arrow>
          Add to tab
        </Button>
        {err && <Err>{err}</Err>}
      </form>
      <div className="xs-open">
        <h3>Open on this tab</h3>
        {state.tab.length === 0 ? (
          <p className="xs-small">Nothing open.</p>
        ) : (
          <ul>
            {state.tab.map((e) => (
              <li key={e.id}>
                <span>{e.note ?? "Charge"}</span>
                <span>{e.amountUsdc}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** A calm mint confirmation with the amount. */
export function PaidOverlay({ amount }: { amount: string | null }) {
  return (
    <div role="status" className="xs-paid">
      <div className="xs-receipt-wrap">
        <div className="xs-receipt">
          <span className="xs-receipt-check" aria-hidden>
            <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
              <path d="M17 33l10 10 21-23" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
            </svg>
          </span>
          <h1 className="xs-receipt-h">Payment confirmed</h1>
          {amount && (
            <p className="xs-receipt-amt">
              {amount} <span>USDC</span>
            </p>
          )}
          <p className="xs-receipt-note">The tab is settled. Thank you!</p>
        </div>
      </div>
    </div>
  );
}

/** Transitional state: the key may still work, so we say so plainly. */
export function RevokingNotice({ seconds, state }: { seconds: number | null; state: ShopState | null }) {
  const t = state?.visit.timings;
  return (
    <div className="xs-revoking" role="status" aria-live="polite">
      <ol className="xs-trio" aria-label="Access status">
        <li data-done="true">Shared</li>
        <li data-on="true" aria-current="step">
          Taking back
        </li>
        <li>Ended</li>
      </ol>
      <h1 className="xs-h1">Revoking access…</h1>
      <p className="xs-lead">They are taking their card back. This usually takes about 30 seconds.</p>
      <p className="xs-small">The shop key may still work until Xenia confirms it. Their details are hidden meanwhile.</p>
      {seconds != null && <p className="xs-wait-note">Waiting {seconds} s since they started</p>}
      {t?.keyRemovedFromListMs != null && <p className="xs-wait-note">Key left the list after {(t.keyRemovedFromListMs / 1000).toFixed(1)} s</p>}
    </div>
  );
}

/** THE moment: the beam is off and the screen is deliberately empty and calm. */
export function AccessEnded({ state, onNext }: { state: ShopState | null; onNext: () => void }) {
  const failed = state?.visit.session.status === "failed";
  const at = state?.visit.session.revokedAt ? new Date(state.visit.session.revokedAt) : null;
  const t = state?.visit.timings;
  return (
    <div role="status" className="xs-ended">
      <h1 className="xs-h1 xs-h1-xl">Access ended</h1>
      <p className="xs-lead">
        {failed ? "We couldn’t read this profile, so nothing is shown." : "This guest has taken their card back. Nothing is shown on this screen."}
      </p>
      <p className="xs-ended-ready">Ready for the next guest</p>
      <ul className="xs-timings">
        {at && <li>Ended at {at.toLocaleTimeString()}</li>}
        {t?.keyRemovedFromListMs != null && <li>The key left the list {(t.keyRemovedFromListMs / 1000).toFixed(1)} s after the revoke transaction.</li>}
        {t?.shopRecallDeniedMs != null && <li>The shop key was rejected {(t.shopRecallDeniedMs / 1000).toFixed(1)} s after the revoke transaction.</li>}
        {t?.shopRecallDeniedMs === null && !failed && <li>The shop key had not been rejected when checking stopped. Treat the cut as unconfirmed.</li>}
      </ul>
      <Button size="lg" arrow onClick={onNext}>
        Next customer
      </Button>
    </div>
  );
}
