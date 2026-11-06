"use client";
import { useState } from "react";
import * as api from "@/app/lib-client/api";
import { usePolling } from "@/app/lib-client/hooks";
import { WalletConnectButton } from "@/components/wallet";
import { useWalletAdapter } from "@/app/customer/wallet-adapter";
import type { ShopConfig, TabState, VisitState } from "@/app/lib-client/api";
import { shopName } from "./shop-name";
import { Btn, Bubble, Check, CopyPill, Disclosure, Empty, Glyph, Notice, Skeleton, Tile, Toast, cx, stagger } from "./ui";

const msg = (x: unknown, fallback: string) => (x instanceof Error ? x.message : fallback);

export function PayPanel({ state, config, goShare }: { state: VisitState | null; config: ShopConfig | null; goShare: () => void }) {
  return (
    <>
      <p className="xc-lead">What you owe the shop right now. You approve every payment in your own wallet.</p>
      {state ? (
        <TabCard state={state} config={config} />
      ) : (
        <Tile tone="soft" delay={1}>
          <Empty
            art={<Glyph kind="receipt" size={52} />}
            title="Nothing to pay yet"
            action={<Btn variant="ghost" size="lg" arrow onClick={goShare}>Share with a shop first</Btn>}
          >
            Your tab opens once a shop can see your card for a visit. Nothing is ever charged without your say-so.
          </Empty>
        </Tile>
      )}
    </>
  );
}

function TabCard({ state, config }: { state: VisitState; config: ShopConfig | null }) {
  const w = useWalletAdapter();
  const customerId = state.session.customerAccountId;
  const shopId = state.session.shopId;
  const shop = shopName(shopId);
  const [tab, setTab] = useState<TabState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [paid, setPaid] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [confirming, setConfirming] = useState(false);
  usePolling(() => api.getTab(customerId, shopId), 3000, true, setTab);
  const open = tab?.open ?? [];
  const total = tab?.openTotalUsdc ?? "0.00";
  const payee = config?.shopAddress ?? null;

  async function pay() {
    setConfirming(false);
    setErr(null);
    try {
      if (!payee) throw new Error("The shop hasn’t set up a payment address yet.");
      setBusy("Waiting for your wallet to approve the payment");
      const digest = await w.pay({ amountUsdc: total, payee });
      setBusy("Confirming your payment on Sui");
      let last = "";
      for (let i = 0; i < 5; i++) {
        const res = await api.verifyPayment(digest, customerId, shopId);
        if (res.payment.ok) {
          setPaid(digest);
          setToast(true);
          setTimeout(() => setToast(false), 6000);
          setTab({ open: res.tab, openTotalUsdc: res.openTotalUsdc });
          return;
        }
        last = res.payment.reason ?? "not verified";
        await new Promise((r) => setTimeout(r, 3000));
      }
      throw new Error(`Your payment went through (${digest}) but we couldn’t confirm it yet: ${last}. Nothing is lost. Check again in a moment.`);
    } catch (x) {
      setErr(msg(x, "That payment didn’t go through. Nothing was charged."));
    } finally {
      setBusy(null);
    }
  }

  const settled = tab !== null && open.length === 0 && !!paid;

  return (
    <Tile tone="white" as="div" delay={1} className={cx("xc-receipt-wrap", settled && "xc-paid")}>
    <section aria-labelledby="tab-h" className="xc-receipt">
      <header className="xc-receipt-head">
        <div>
          <p className="xc-kicker">Tab at</p>
          <h2 id="tab-h" className="xc-h2 is-big">{shop}</h2>
        </div>
        {open.length > 0 ? <Bubble tone="yellow">Open</Bubble> : settled ? <Bubble tone="green">Settled</Bubble> : <Bubble tone="soft">Nothing owed</Bubble>}
      </header>
      {tab === null && <Skeleton rows={2} />}
      {tab !== null && open.length === 0 && (
        settled ? (
          <div className="xc-settled">
            <div className="xc-celebrate" aria-hidden="true">
              <Check size={44} />
            </div>
            <p className="xc-settled-t">All settled</p>
            <p className="xc-fine">Thank you. {shop} has been paid.</p>
          </div>
        ) : (
          <Empty art={<Glyph kind="receipt" size={52} />} title="Nothing on your tab">
            {shop} adds charges during your visit. They’ll appear here.
          </Empty>
        )
      )}
      {open.length > 0 && (
        <ul className="xc-lines">
          {open.map((e, i) => (
            <li key={e.id} style={stagger(Math.min(i, 8))}>
              <span className="xc-line-n">{e.note ?? "Charge"}</span>
              <span className="xc-leader" aria-hidden="true" />
              <span className="xc-amt">{e.amountUsdc}</span>
            </li>
          ))}
        </ul>
      )}
      {open.length > 0 && (
        <>
          <div className="xc-total">
            <span>Total</span>
            <p className="xc-total-n"><strong>{total}</strong> <span>USDC</span></p>
          </div>
          {err && <div className="xc-gap"><Notice>{err}</Notice></div>}
          {!w.connected && !api.USE_MOCKS && (
            <div className="xc-connect"><Notice tone="warn">Connect your wallet to pay.</Notice><WalletConnectButton /></div>
          )}
          {confirming ? (
            <div role="alertdialog" aria-labelledby="confirm-h" className="xc-confirm">
              <p id="confirm-h" className="xc-confirm-t">Confirm and sign</p>
              <p className="xc-confirm-s">You’re about to send exactly</p>
              <p className="xc-confirm-amt"><strong>{total}</strong> USDC</p>
              <p className="xc-fine">Native USDC on Sui mainnet, to:</p>
              <p className="xc-payee">{payee ?? "(no payee configured)"}</p>
              <p className="xc-fine">Shop: {shop}. Your wallet will show the payment once more for a final yes.</p>
              <div className="xc-confirm-row">
                <Btn size="lg" arrow onClick={pay} disabled={!payee || !w.connected}>Confirm and sign</Btn>
                <Btn variant="light" size="lg" onClick={() => setConfirming(false)}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <Btn size="lg" block arrow className="xc-pay" loading={!!busy} disabled={!w.connected} onClick={() => setConfirming(true)}>Pay {total} USDC</Btn>
          )}
          {busy && <p role="status" className="xc-status">{busy}…</p>}
          <p className="xc-fine xc-gap-t">You sign in your own wallet. Xenia then checks the payment landed on Sui, via Tatum.</p>
        </>
      )}
      {paid && (
        <Disclosure summary="Proof" className="xc-proof xc-paid-proof">
          <div className="xc-proof-row"><span><Check size={16} /> Payment confirmed</span><CopyPill value={paid} label="payment digest" /></div>
        </Disclosure>
      )}
      {toast && <Toast onClose={() => setToast(false)}>Paid. Thanks for settling up with {shop}.</Toast>}
    </section>
    </Tile>
  );
}
