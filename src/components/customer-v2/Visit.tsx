"use client";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import * as api from "@/app/lib-client/api";
import { formatDuration, useNow, usePolling, useStoredString } from "@/app/lib-client/hooks";
import { WalletConnectButton } from "@/components/wallet";
import { useWalletAdapter } from "@/app/customer/wallet-adapter";
import type { ShopConfig, VisitState } from "@/app/lib-client/api";
import type { VisitTimings } from "@/lib/visit/types";
import { BeamLink } from "@/components/beam";
import { PayPanel } from "./Pay";
import { shopName } from "./shop-name";
import { Btn, Bubble, Busy, Check, CopyPill, CutoffRing, Disclosure, Glyph, Notice, Skeleton, Stamp, Steps, Tile, TileHead, Toast, cx } from "./ui";

const msg = (x: unknown, fallback: string) => (x instanceof Error ? x.message : fallback);

export function VisitSection({
  view, onLive, goShare,
}: {
  view: string;
  onLive: (shop: string | null) => void;
  goShare: () => void;
}) {
  const [visitId, setVisitId] = useStoredString("xenia-active-visit");
  const [state, setState] = useState<VisitState | null>(null);
  const [pollErr, setPollErr] = useState<string | null>(null);
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [cfgErr, setCfgErr] = useState<string | null>(null);

  useEffect(() => {
    api.getShopConfig().then(setConfig).catch((e: Error) => setCfgErr(e.message));
  }, []);
  usePolling(() => api.getVisitState(visitId!), 2000, !!visitId, (s) => { setState(s); setPollErr(null); }, (e) => setPollErr(e.message));

  const current = visitId && state && state.session.id === visitId ? state : null;
  const status = current?.session.status;
  const finished = status === "revoked" || status === "failed";
  const isLive = status === "active" || status === "revoking";
  const liveShop = isLive ? current!.session.shopId : null;

  useEffect(() => { onLive(liveShop); }, [liveShop, onLive]);

  const steps: { label: string; state: "done" | "now" | "todo" }[] = [
    { label: "Show code", state: visitId && !(finished && status !== "revoked") ? "done" : "now" },
    { label: "Share", state: isLive || status === "revoked" ? "done" : visitId && !finished ? "now" : "todo" },
    { label: "Visiting", state: status === "revoked" ? "done" : isLive ? "now" : "todo" },
    { label: "Done", state: status === "revoked" ? "now" : "todo" },
  ];

  return (
    <>
      <div role="tabpanel" id="panel-visit" aria-labelledby="tab-visit" hidden={view !== "visit"} className="xc-panel">
        <p className="xc-lead">Let one shop see your card for one visit. Take it back whenever you like.</p>
        <Steps steps={steps} />
        {cfgErr && <Notice>We couldn’t load the shop details. {cfgErr}</Notice>}
        {pollErr && visitId && <Notice tone="warn">We can’t reach the visit right now. {pollErr}</Notice>}
        {visitId && !current && !pollErr && (
          <Tile tone="soft" delay={1}>
            <Busy label="Checking your visit" />
            <Skeleton rows={2} />
          </Tile>
        )}
        {current && isLive && <ActiveVisit state={current} onChange={setState} />}
        {current && status === "revoked" && (
          <>
            <Timings state={current} />
            <Btn variant="ghost" size="lg" block arrow onClick={() => { setState(null); setVisitId(null); }}>Start another visit</Btn>
          </>
        )}
        {(!visitId || (finished && status !== "revoked")) && (
          <Join config={config} onJoined={(id) => { setState(null); setVisitId(id); }} note={status === "failed" ? "That visit didn’t work out. You can try again with a fresh code." : null} />
        )}
        <MyCodeCard config={config} />
      </div>

      <div role="tabpanel" id="panel-tab" aria-labelledby="tab-tab" hidden={view !== "tab"} className="xc-panel">
        <PayPanel state={current && isLive ? current : null} config={config} goShare={goShare} />
      </div>
    </>
  );
}

function MyCodeCard({ config }: { config: ShopConfig | null }) {
  const w = useWalletAdapter();
  const [src, setSrc] = useState<string | null>(null);
  const code = config?.demoAccountId ? api.encodeCustomerCode({ accountId: config.demoAccountId, ownerAddress: config.demoOwnerAddress }) : null;
  useEffect(() => {
    if (!code) return;
    let alive = true;
    QRCode.toDataURL(code, { margin: 1, width: 440, color: { dark: "#050b2a", light: "#ffffff" } }).then((u) => alive && setSrc(u));
    return () => { alive = false; };
  }, [code]);
  const mismatch = !api.USE_MOCKS && w.address && config?.demoOwnerAddress && w.address.toLowerCase() !== config.demoOwnerAddress.toLowerCase();
  return (
    <Tile tone="soft" aria-labelledby="code-h" delay={3} className="xc-codecard">
      <TileHead id="code-h" kicker="Visit pass" aside={<Glyph kind="ticket" size={44} />} hint="Show this to the shop so it knows whose card to ask for. It holds no secrets.">
        My code
      </TileHead>
      {!config && (
        <>
          <Busy label="Loading" />
          <Skeleton rows={2} />
        </>
      )}
      {config && !code && <Notice>This app doesn’t have a card set up on the server yet.</Notice>}
      {code && config && (
        <div className="xc-ticket">
          <div className="xc-qr">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="QR code of your Xenia customer code" width={200} height={200} />
            ) : (
              <span className="xc-qr-ph xc-sk" aria-hidden="true" />
            )}
          </div>
          <div className="xc-ticket-cut" aria-hidden="true"><i /><i /></div>
          <p className="xc-ticket-t">Hold this up to the shop’s screen</p>
          <Disclosure summary="Details" className="xc-ticket-det">
            <dl className="xc-kv">
              <div><dt>Account</dt><dd><CopyPill value={config.demoAccountId!} label="account id" /></dd></div>
              <div><dt>Owner</dt><dd><CopyPill value={config.demoOwnerAddress ?? "unknown"} label="owner address" /></dd></div>
              <div><dt>Full code</dt><dd><CopyPill value={code} label="customer code" /></dd></div>
            </dl>
          </Disclosure>
        </div>
      )}
      {mismatch && <div className="xc-gap"><Notice tone="warn">The wallet you connected isn’t the owner of this card, so it can’t share or take back access.</Notice></div>}
    </Tile>
  );
}

function Join({ config, onJoined, note }: { config: ShopConfig | null; onJoined: (id: string) => void; note: string | null }) {
  const w = useWalletAdapter();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const parsed = api.parseVisitQr(raw.trim());
  const shop = parsed ? shopName(parsed.shopId) : null;

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed) return setErr("That doesn’t look like a Xenia visit code. Paste the full text shown on the shop’s screen.");
    if (!config?.memwal) return setErr("Still getting set up. Try again in a moment.");
    setErr(null);
    try {
      setBusy("Checking the visit");
      const st = await api.getVisitState(parsed.visitId);
      if (st.session.status !== "pending") throw new Error(`This visit is already ${st.session.status}.`);
      if (st.session.delegatePublicKey.toLowerCase() !== parsed.publicKey) throw new Error("This code doesn’t match the shop’s key. Ask them to show a fresh one.");
      setBusy("Waiting for your wallet to approve");
      const digest = await w.grant({
        packageId: config.memwal.packageId,
        registryId: config.memwal.registryId,
        accountId: parsed.accountId,
        publicKey: parsed.publicKey,
        label: `Xenia visit ${parsed.shopId} ${parsed.visitId.slice(0, 8)}`,
        ownerAddress: st.ownerAddress,
      });
      setBusy("Waiting for the network to confirm (up to a minute)");
      const done = await api.grantConfirm(parsed.visitId, digest);
      if (done.session.status !== "active") throw new Error(done.lastError ?? "Sharing wasn’t confirmed");
      setRaw("");
      onJoined(parsed.visitId);
    } catch (x) {
      setErr(msg(x, "Could not share your card"));
    } finally {
      setBusy(null);
    }
  }
  return (
    <Tile tone="soft" aria-labelledby="visit-h" delay={2}>
      <TileHead id="visit-h" hint="Paste the code from the shop’s screen. You’ll see exactly who it’s for before anything is shared.">
        At a shop
      </TileHead>
      {note && <div className="xc-gap-b"><Notice tone="warn">{note}</Notice></div>}
      <form onSubmit={grant} className="xc-form">
        <label htmlFor="qr" className="xc-label">The shop’s visit code</label>
        <textarea
          id="qr"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={3}
          placeholder='Paste it here. It looks like {"shopId":"corner-shop", …}'
          spellCheck={false}
          className="xc-input xc-code-in"
        />
        {parsed && shop && (
          <div className="xc-consent" aria-live="polite">
            <div className="xc-consent-head">
              <Glyph kind="key" size={40} />
              <p><strong>{shop}</strong> will see</p>
            </div>
            <ul>
              <li>Your usual</li>
              <li>Important notes</li>
              <li>How you pay</li>
            </ul>
            <p className="xc-consent-until"><Bubble tone="ink">Until you take it back</Bubble> You can do that any time from this screen.</p>
            <Disclosure summary="Details" className="xc-consent-det">
              <p>Your wallet adds a key for this visit on Sui, which costs a small network fee. Key <span className="xc-mono">{parsed.publicKey.slice(0, 12)}…</span></p>
              <p>Taking it back stops future reads. Anything already read can’t be unread.</p>
            </Disclosure>
          </div>
        )}
        {err && <Notice>{err}</Notice>}
        {!w.connected && !api.USE_MOCKS && (
          <div className="xc-connect">
            <Notice tone="warn">Connect your wallet first, so you can approve this yourself.</Notice>
            <WalletConnectButton />
          </div>
        )}
        <Btn type="submit" size="lg" block arrow loading={!!busy} disabled={!parsed || !w.connected}>
          {shop ? `Share with ${shop}` : "Share my card for this visit"}
        </Btn>
        {busy && <p role="status" className="xc-status">{busy}…</p>}
      </form>
    </Tile>
  );
}

function ActiveVisit({ state, onChange }: { state: VisitState; onChange: (s: VisitState) => void }) {
  const w = useWalletAdapter();
  const { session } = state;
  const shop = shopName(session.shopId);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const revoking = session.status === "revoking";
  const now = useNow(1000);
  const since = (now - Date.parse(session.grantedAt)) / 1000;
  // The countdown starts when taking it back starts (here, or first seen via polling), not when this card mounted.
  const [seenRevoking, setSeenRevoking] = useState<number | null>(null);
  if (revoking && seenRevoking === null) setSeenRevoking(now);
  const revokeStart = session.revokedAt ? Date.parse(session.revokedAt) : seenRevoking ?? now;

  const revoke = useCallback(async () => {
    setErr(null);
    try {
      setSeenRevoking(Date.now());
      setBusy("Getting ready to take it back");
      const r = await api.revokeStart(session.id);
      onChange(r);
      setBusy("Waiting for your wallet to approve");
      const digest = await w.revoke(r.walletAction);
      setBusy("Checking when the shop’s access really stops (can take over a minute)");
      onChange(await api.revokeConfirm(session.id, digest));
    } catch (x) {
      setErr(msg(x, "Could not take it back. Try again."));
    } finally {
      setBusy(null);
    }
  }, [session.id, w, onChange]);

  return (
    <Tile tone={revoking ? "yellow" : "lime"} aria-labelledby="active-h" delay={1} className={cx("xc-active", revoking ? "is-revoking" : "is-live")}>
      <BeamLink to={shop} level={revoking ? 0.22 : 1} />
      <div className="xc-active-top">
        {!revoking && <Bubble tone="ink" className="xc-live-dot">Live now</Bubble>}
        {revoking && <Bubble tone="yellow" className="xc-live-dot is-pulse">Taking it back</Bubble>}
        <h2 id="active-h" className="xc-h2 is-big">
          {revoking ? "Taking it back…" : `${shop} can see your card`}
        </h2>
        {!revoking && <Stamp className="xc-active-stamp">Shared · this visit only</Stamp>}
      </div>
      {!revoking && (
        <div className="xc-timer-wrap">
          <p className="xc-timer-label">Shared for</p>
          <p className="xc-timer" aria-live="off">{formatDuration(since)}</p>
          <p className="xc-fine xc-honest">
            When you take it back, the shop should stop seeing your card within about 30 seconds. We’ll measure it and show you. Anything already seen can’t be unseen.
          </p>
        </div>
      )}
      {revoking && (
        <div className="xc-revoking">
          <CutoffRing elapsed={(now - revokeStart) / 1000} />
          <p className="xc-revoking-t">Taking it back. This takes about 30 seconds.</p>
          <p className="xc-fine xc-honest">The shop should stop seeing your card in about 30 seconds. Anything already seen can’t be unseen.</p>
        </div>
      )}
      {state.lastError && <div className="xc-gap"><Notice>{state.lastError}</Notice></div>}
      {err && <div className="xc-gap"><Notice>{err}</Notice></div>}
      {busy && <p role="status" className="xc-status">{busy}…</p>}
      {(!revoking || (!busy && !!err)) && (
        <>
          {!w.connected && !api.USE_MOCKS && <div className="xc-connect"><Notice tone="warn">Connect your wallet to take it back.</Notice><WalletConnectButton /></div>}
          <Btn size="lg" block className="xc-revoke" loading={!!busy} disabled={!w.connected} onClick={revoke}>
            Take it back
          </Btn>
        </>
      )}
      <Disclosure summary="Details" className="xc-active-det">
        <div className="xc-proof-row"><span>Shop</span><span className="xc-mono">{session.shopId}</span></div>
        {session.grantDigest && <div className="xc-proof-row"><span>Grant</span><CopyPill value={session.grantDigest} label="grant digest" /></div>}
      </Disclosure>
    </Tile>
  );
}

const ms = (v: number | null | undefined) => (v === null ? "never rejected within the window" : v === undefined ? "n/a" : `${(v / 1000).toFixed(1)} s`);

function Timings({ state }: { state: VisitState }) {
  const t: VisitTimings = state.timings;
  const shop = shopName(state.session.shopId);
  const [toast, setToast] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setToast(false), 6000);
    return () => clearTimeout(id);
  }, []);
  return (
    <Tile tone="white" aria-labelledby="timing-h" delay={1} className="xc-ended">
      <BeamLink to={shop} level={0} />
      <div className="xc-ended-top">
        <Stamp tone="coral" className="xc-active-stamp">Taken back</Stamp>
        <h2 id="timing-h" className="xc-h2 is-big">{shop} can no longer see your card</h2>
      </div>
      <p className="xc-ok-line"><Check size={20} />
        {t.shopRecallDeniedMs === null || t.shopRecallDeniedMs === undefined
          ? "Access taken back."
          : `The shop was blocked ${ms(t.shopRecallDeniedMs)} after you confirmed.`}
      </p>
      <p className="xc-kicker xc-mt">What we measured</p>
      <dl className="xc-timings">
        <div><dt>Shop’s key added, after you approved</dt><dd>{ms(t.grantListedMs)}</dd></div>
        <div><dt>Key removed, after you took it back</dt><dd>{ms(t.keyRemovedFromListMs)}</dd></div>
        <div><dt>Shop’s next read turned away</dt><dd>{ms(t.shopRecallDeniedMs)}</dd></div>
        <div><dt>Times we checked</dt><dd>{t.recallProbes ?? "n/a"}</dd></div>
      </dl>
      {t.shopRecallDeniedMs === null && (
        <div className="xc-gap"><Notice tone="warn">The shop’s key was still accepted for a while after you took it back. It is removed now, but they could have kept reading for a short time.</Notice></div>
      )}
      {state.lastError && <p className="xc-warn">{state.lastError}</p>}
      {t.evidence.length > 0 && (
        <Disclosure summary="Details" className="xc-active-det">
          <ul className="xc-evidence">{t.evidence.map((l) => <li key={l}>{l}</li>)}</ul>
        </Disclosure>
      )}
      <p className="xc-fine xc-honest">Taking it back only works going forward. Anything the shop already saw can’t be unseen.</p>
      {toast && <Toast onClose={() => setToast(false)}>Taken back. {shop} can no longer see your card.</Toast>}
    </Tile>
  );
}
