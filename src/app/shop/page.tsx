"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import * as api from "@/app/lib-client/api";
import type { ShopProfile, ShopState } from "@/app/lib-client/api";
import { useNow, usePolling, useStoredString } from "@/app/lib-client/hooks";
import { BeamCanvas, Button, Wordmark } from "@/components/beam";
import { AccessEnded, Err, PaidOverlay, ProfileView, RevokingNotice, Waiting } from "@/components/shop-v2/views";
import { encodeQrPayload } from "@/lib/visit/qr";
import "../shop.css";

const SHOP_ID = "corner-shop";
const DISSOLVE_MS = 1500;

interface Stored { id: string; qr: string }

/** What the counter is showing. Presentation only: it drives how bright the beam is and where it starts. */
type Phase = "start" | "connecting" | "waiting" | "guest" | "paid" | "revoking" | "ended";
const BEAM: Record<Phase, { level: number; origin: [number, number]; mobile: [number, number]; orbit: number }> = {
  start: { level: 0.6, origin: [0.46, 0.55], mobile: [0.08, 0.66], orbit: 0.9 },
  connecting: { level: 0.4, origin: [0.5, 0.42], mobile: [0.4, 0.66], orbit: 0.8 },
  waiting: { level: 0.85, origin: [0.44, 0.54], mobile: [0.08, 0.66], orbit: 0.9 },
  guest: { level: 1, origin: [0.035, 0.42], mobile: [0.08, 0.66], orbit: 1 },
  paid: { level: 1, origin: [0.035, 0.42], mobile: [0.08, 0.66], orbit: 1 },
  revoking: { level: 0.22, origin: [0.035, 0.42], mobile: [0.08, 0.66], orbit: 1 },
  ended: { level: 0, origin: [0.36, 0.3], mobile: [0.2, 0.66], orbit: 0.8 },
};

export default function ShopPage() {
  const [raw, setRaw] = useStoredString("xenia-shop-visit");
  const stored: Stored | null = raw ? (JSON.parse(raw) as Stored) : null;
  const [online, setOnline] = useState(true);
  const [counterPhase, setPhase] = useState<Phase>("connecting");
  const phase: Phase = stored ? counterPhase : "start";
  const beam = BEAM[phase];
  return (
    <div className="xb xenia-shop" data-phase={phase}>
      <div className="xs-screen xb-dark">
        <BeamCanvas level={beam.level} origin={beam.origin} originMobile={beam.mobile} orbitScale={beam.orbit} spread={0.62} />
        <header className="xs-header">
          <Link href="/" aria-label="Xenia home" className="xb-brand xs-brand">
            <Wordmark size={26} />
          </Link>
          <div className="xs-header-r">
            <span className="xb-seg xs-meta">At the counter · {SHOP_ID}</span>
            {stored && (
              <span className={`xb-seg xs-live ${online ? "" : "is-off"}`} role="status">
                <i aria-hidden />
                {online ? "Live" : "Reconnecting"}
              </span>
            )}
            {api.USE_MOCKS && (
              <span className="xb-seg xs-demo" title="Mock data from the browser, not Walrus, Tatum or Sui">
                Demo data
              </span>
            )}
          </div>
        </header>
        <main id="main" className="xs-main">
          {!stored && <StartVisit onStarted={(s) => setRaw(JSON.stringify(s))} />}
          {stored && <Counter key={stored.id} stored={stored} onNext={() => setRaw(null)} onOnline={setOnline} onPhase={setPhase} />}
        </main>
      </div>
    </div>
  );
}

/** Step 1: the shop takes the customer's code and creates a per-visit key. */
function StartVisit({ onStarted }: { onStarted: (s: Stored) => void }) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const parsed = api.parseCustomerCode(raw);

  async function demo() {
    setErr(null);
    try {
      const c = await api.getShopConfig();
      if (!c.demoAccountId) throw new Error("The server has no demo customer account configured.");
      setRaw(api.encodeCustomerCode({ accountId: c.demoAccountId, ownerAddress: c.demoOwnerAddress }));
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not load the demo customer");
    }
  }
  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return setErr("That is not a Xenia customer code. Paste the code from the customer’s “My code” card.");
    setBusy(true);
    setErr(null);
    try {
      const r = await api.createVisit(SHOP_ID, parsed.accountId, parsed.ownerAddress ?? undefined);
      onStarted({ id: r.session.id, qr: encodeQrPayload(r.qr) });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Could not start the visit");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="xs-start">
      <div className="xs-start-copy">
        <p className="xb-kicker">Counter screen</p>
        <h1 id="start-h" className="xs-h1 xs-h1-xl">
          Welcome the next guest
        </h1>
        <p className="xs-lead">They keep their card. You see it for one visit.</p>
        <ol className="xs-start-steps">
          <li>
            <b>01</b>Paste their code, or try the demo guest
          </li>
          <li>
            <b>02</b>They scan the visit code
          </li>
          <li>
            <b>03</b>Their usual shows up here
          </li>
        </ol>
      </div>
      <section className="xs-startcard" aria-labelledby="start-h">
        <h2>Start a visit</h2>
        <p>Paste the code from “My code” on their phone, or try the demo guest. Xenia then makes a one-visit code for this counter.</p>
        <form onSubmit={start}>
          <div className="xs-field">
            <label className="xs-label" htmlFor="cc">Customer code</label>
            <textarea id="cc" className="xs-input xs-textarea" value={raw} onChange={(e) => setRaw(e.target.value)} rows={3} spellCheck={false} placeholder='{"type":"xenia-customer","accountId":"0x…"}' />
          </div>
          {err && <Err>{err}</Err>}
          <div className="xs-row">
            <Button type="submit" size="lg" arrow loading={busy} disabled={!parsed}>Create visit code</Button>
            <Button type="button" tone="ghost" size="lg" onClick={demo}>Use demo customer</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Counter({
  stored,
  onNext,
  onOnline,
  onPhase,
}: {
  stored: Stored;
  onNext: () => void;
  onOnline: (b: boolean) => void;
  onPhase: (p: Phase) => void;
}) {
  const [state, setState] = useState<ShopState | null>(null);
  const [lastProfile, setLastProfile] = useState<ShopProfile | null>(null);
  const [pollErr, setPollErr] = useState<string | null>(null);
  const [paidNow, setPaidNow] = useState(false);
  const [paidAmount, setPaidAmount] = useState<string | null>(null);
  const [revokingSince, setRevokingSince] = useState<number | null>(null);
  const [prevOpen, setPrevOpen] = useState(0);
  const [sawTab, setSawTab] = useState(false);

  const status = state?.visit.session.status;
  // Final ONLY when the server says `revoked`/`failed`, or the relayer has actually rejected the shop key
  // (recallRejected, or a measured shopRecallDeniedMs). `revoking` alone is transitional: the key may still work.
  const denied = typeof state?.visit.timings.shopRecallDeniedMs === "number";
  const final = status === "revoked" || status === "failed" || !!state?.recallRejected || denied;
  const revoking = status === "revoking" && !final;

  usePolling(
    () => api.getShopState(stored.id),
    2000,
    true,
    (s) => {
      setState(s);
      setPollErr(null);
      onOnline(true);
      if (s.visit.session.status === "active" && !s.recallRejected) setLastProfile(api.profileFromRecalled(s.facts));
      if (s.visit.session.status === "revoking") setRevokingSince((v) => v ?? Date.now());
      const open = Number(s.openTotalUsdc);
      if (open > 0) setSawTab(true);
      if (prevOpen > 0 && open === 0 && sawTab) {
        setPaidAmount(prevOpen.toFixed(2));
        setPaidNow(true);
      }
      setPrevOpen(open);
    },
    (e) => {
      setPollErr(e.message);
      onOnline(false);
    },
  );

  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!final || !lastProfile) return;
    const t = setTimeout(() => setGone(true), DISSOLVE_MS);
    return () => clearTimeout(t);
  }, [final, lastProfile]);

  useEffect(() => {
    if (!paidNow) return;
    const t = setTimeout(() => setPaidNow(false), 5000);
    return () => clearTimeout(t);
  }, [paidNow]);

  const now = useNow(1000, revoking);
  const showEnded = final && (gone || !lastProfile);
  const dissolving = final && !showEnded;
  const phase: Phase = showEnded ? "ended" : !state ? "connecting" : status === "pending" ? "waiting" : revoking || dissolving ? "revoking" : paidNow ? "paid" : "guest";
  useEffect(() => {
    onPhase(phase);
  }, [phase, onPhase]);

  if (showEnded) return <AccessEnded state={state} onNext={onNext} />;
  if (!state) {
    return (
      <div className="xs-ended" role="status">
        <span className="xs-conn" aria-hidden />
        <p className="xs-lead">Connecting</p>
        {pollErr && <Err>{pollErr}</Err>}
      </div>
    );
  }
  if (status === "pending") return <Waiting qr={stored.qr} err={pollErr} />;

  const profile = revoking || dissolving ? lastProfile : api.profileFromRecalled(state.facts);
  const seconds = revokingSince ? Math.max(0, Math.round((now - revokingSince) / 1000)) : null;
  return (
    <div className="xs-stage">
      {profile && (
        <div className={revoking ? "xs-profile-wrap is-dim" : dissolving ? "xs-profile-wrap is-folding" : "xs-profile-wrap"} aria-hidden={revoking || dissolving || undefined}>
          <ProfileView profile={profile} state={state} />
        </div>
      )}
      {revoking && (
        <div className="xs-revoking-wrap">
          <RevokingNotice seconds={seconds} state={state} />
        </div>
      )}
      {paidNow && <PaidOverlay amount={paidAmount} />}
      {pollErr && (
        <div className="xs-hiccup">
          <Err>Connection hiccup: {pollErr}</Err>
        </div>
      )}
    </div>
  );
}
