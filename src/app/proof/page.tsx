import Link from "next/link";
import { Suspense, cache } from "react";
import { connection } from "next/server";
import { ArrowRight, BeamCanvas, Wordmark } from "@/components/beam";
import { Chip, Empty, SectionHead, Stat } from "@/components/proof/parts";
import { CopyButton } from "./CopyButton";
import { loadEvidence } from "./data";
import "../proof.css";

export const metadata = { title: "Xenia receipts" };

const secs = (v: number | null | undefined) => (v == null ? null : `${(v / 1000).toFixed(1)} s`);
const when = (iso: string) => (iso ? iso.slice(0, 16).replace("T", " ") : "-");
const tx = (d: string) => `https://suiscan.xyz/mainnet/tx/${d}`;

/** One read of .data/ per request, shared by the counters in the hero and the tables below. */
const getEvidence = cache(async () => {
  await connection(); // read .data/ at request time, never at build time
  return loadEvidence();
});

function Id({ value, href, label }: { value: string; href?: string; label: string }) {
  return (
    <span className="xp-id">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" title="Open on Suiscan (new tab)">
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
      <CopyButton value={value} label={`Copy ${label}`} />
    </span>
  );
}

async function Stats() {
  const ev = await getEvidence();
  const saved = ev.memories.filter((m) => m.status === "saved" && m.blobId);
  const verified = ev.payments.filter((p) => p.onChainSuccess);
  const revoked = ev.visits.filter((v) => v.shopRecallDeniedMs != null);
  return (
    <>
      <div className="xp-stats">
        <Stat
          tone="orange"
          label="Memories saved on Walrus"
          value={saved.length}
          note="Counted from saved memories that came back with a blob id."
        />
        <Stat
          tone="yellow"
          label="Payments confirmed on Sui"
          value={verified.length}
          of={`of ${ev.payments.length}`}
          note="Settled payments whose transaction we read back as successful."
        />
        <Stat
          tone="sky"
          label="Visits where access was taken back"
          value={revoked.length}
          of={`of ${ev.visits.length}`}
          note="Visits where the shop’s key was measured being refused afterwards."
        />
        <Stat
          tone="lilac"
          label="Transactions read back from Sui"
          value={ev.verifiedTxCount}
          note="Transactions we fetched by digest and kept a copy of."
        />
      </div>
      <p className="xp-note xp-note-dark">
        These numbers come from this deployment’s own records, counted again each time the page loads. The page itself does
        not ask the chain, so copy any id and check it on an explorer.
      </p>
    </>
  );
}

function StatsSkeleton() {
  return (
    <div className="xp-stats" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="xp-stat is-skel">
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

async function Evidence() {
  const ev = await getEvidence();
  const verified = ev.payments.filter((p) => p.onChainSuccess);
  const revoked = ev.visits.filter((v) => v.shopRecallDeniedMs != null);

  return (
    <>
      <section className="xp-sec" aria-labelledby="mem-h" id="memories">
        <div className="xp-wrap">
          <SectionHead tag="Walrus" id="mem-h" lead="What guests told Xenia, saved to Walrus. Each one has a blob id you can copy and look up.">
            Memories
          </SectionHead>
          {ev.memories.length === 0 ? (
            <Empty title="No memories saved yet" tone="orange">
              When someone tells Xenia how they like things in the customer app, each memory is saved to Walrus and shows up here
              with its blob id.
            </Empty>
          ) : (
            <div className="xp-tablewrap">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th scope="col">Saved</th>
                    <th scope="col">Kind</th>
                    <th scope="col">Memory</th>
                    <th scope="col">Status</th>
                    <th scope="col">Blob id</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.memories.map((m, i) => (
                    <tr key={m.blobId ?? i}>
                      <td data-label="Saved" className="xp-nowrap xp-muted">{when(m.createdAt)}</td>
                      <td data-label="Kind"><span className="xp-kind">{m.kind || "-"}</span></td>
                      <td data-label="Memory">{m.text}</td>
                      <td data-label="Status">
                        <Chip s={m.status === "saved" && m.blobId ? "ok" : "unknown"} label={m.status || "unknown"} />
                      </td>
                      <td data-label="Blob id">{m.blobId ? <Id value={m.blobId} label="blob id" /> : <span className="xp-muted">none yet</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="xp-note">Blob ids have a copy button but no link: we have not confirmed a stable explorer address for them.</p>
        </div>
      </section>

      <section className="xp-sec" aria-labelledby="pay-h" id="payments">
        <div className="xp-wrap">
          <SectionHead tag="Sui" id="pay-h" lead="Tabs settled in USDC. Each digest links to Suiscan so you can see the transfer yourself.">
            Payments
          </SectionHead>
          {ev.payments.length === 0 ? (
            <Empty title="No payments settled yet" tone="yellow">
              After a guest pays their tab in USDC, Xenia reads the transaction back, checks it succeeded and paid the shop, then
              settles the tab once. That payment appears here.
            </Empty>
          ) : (
            <div className="xp-tablewrap">
              <table className="xp-table">
                <thead>
                  <tr>
                    <th scope="col">Settled</th>
                    <th scope="col">Paid</th>
                    <th scope="col">On Sui</th>
                    <th scope="col">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.payments.map((p) => (
                    <tr key={p.digest}>
                      <td data-label="Settled" className="xp-nowrap xp-muted">{when(p.settledAt)}</td>
                      <td data-label="Paid" className="xp-nowrap xp-amt">{p.paidUsdc} <span>USDC</span></td>
                      <td data-label="On Sui">
                        {p.onChainSuccess === undefined ? (
                          <Chip s="unknown" label="not checked yet" />
                        ) : p.onChainSuccess ? (
                          <Chip s="ok" label="confirmed" />
                        ) : (
                          <Chip s="no" label="failed" />
                        )}
                      </td>
                      <td data-label="Transaction"><Id value={p.digest} href={tx(p.digest)} label="transaction digest" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="xp-note">{verified.length} of {ev.payments.length} settled payments confirmed successful on Sui.</p>
        </div>
      </section>

      <section className="xp-sec" aria-labelledby="visit-h" id="visits">
        <div className="xp-wrap">
          <SectionHead
            tag="Visits"
            id="visit-h"
            lead="A guest shares their card for one visit, then takes it back. Taking it back stops future reads; it cannot unsee what the shop already read. Timings stay ‘not measured yet’ until a real share and take-back has run."
          >
            Shared, then taken back
          </SectionHead>
          {ev.visits.length === 0 ? (
            <Empty title="No visits recorded yet" tone="sky">
              Open the counter screen, share a card from the customer app, then take it back. How long each step took lands here.
            </Empty>
          ) : (
            <ul className="xp-visits">
              {ev.visits.map((v) => (
                <li key={v.id} className="xp-visit">
                  <div className="xp-visit-h">
                    <span className="xp-mono">Visit {v.id.slice(0, 8)}</span>
                    <span className="xp-muted">at {v.shopId}</span>
                    <span className={`xp-status is-${v.status}`}>{v.status || "unknown"}</span>
                  </div>
                  <dl className="xp-timings">
                    {(
                      [
                        ["Card shared and listed", v.grantListedMs],
                        ["Shop key removed", v.keyRemovedFromListMs],
                        ["Shop key refused", v.shopRecallDeniedMs],
                      ] as const
                    ).map(([k, val]) => (
                      <div className="xp-timing" key={k}>
                        <dt>{k}</dt>
                        <dd className={val == null ? "is-none" : undefined}>{secs(val) ?? "not measured yet"}</dd>
                      </div>
                    ))}
                    <div className="xp-timing">
                      <dt>Times we checked</dt>
                      <dd className={v.recallProbes == null ? "is-none" : undefined}>{v.recallProbes ?? "not measured yet"}</dd>
                    </div>
                  </dl>
                  {(v.grantDigest || v.revokeDigest) && (
                    <div className="xp-txs">
                      {v.grantDigest && (
                        <p className="xp-tx">
                          <span>Shared</span>
                          <Id value={v.grantDigest} href={tx(v.grantDigest)} label="share transaction" />
                        </p>
                      )}
                      {v.revokeDigest && (
                        <p className="xp-tx">
                          <span>Taken back</span>
                          <Id value={v.revokeDigest} href={tx(v.revokeDigest)} label="take-back transaction" />
                        </p>
                      )}
                    </div>
                  )}
                  {v.evidence.length > 0 && (
                    <details className="xp-evid">
                      <summary>Raw log ({v.evidence.length})</summary>
                      {v.evidence.map((e, i) => (
                        <p key={i}>{e}</p>
                      ))}
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="xp-note">{revoked.length} of {ev.visits.length} visits with the shop key measured being refused.</p>
        </div>
      </section>
    </>
  );
}

const CHECKS = [
  ["Did the payment go through?", "We read the transaction by its digest and check it succeeded and that USDC reached the shop. Each payment settles a tab only once.", "LedgerService.GetTransaction"],
  ["What is in the wallet?", "We read the guest’s USDC and SUI balances so the app can show what they can pay with.", "StateService.ListBalances"],
  ["Does the address have a name?", "If the address has a SuiNS name we show it. If the lookup fails, we simply show the address.", "NameService.ReverseLookupName"],
] as const;

export default function ProofPage() {
  return (
    <div className="xb xenia-proof">
      <header className="xp-head xb-dark">
        <div className="xp-top">
          <Link href="/" className="xb-brand xp-brand" aria-label="Xenia home">
            <Wordmark size={26} />
          </Link>
          <nav className="xp-nav xb-segs" aria-label="Primary">
            <Link href="/customer" className="xb-seg">Customer app</Link>
            <Link href="/shop" className="xb-seg">Counter screen</Link>
            <Link href="/" className="xb-seg">Back to Xenia</Link>
          </nav>
          <Link href="/customer" className="xb-btn is-white is-sm has-arrow xp-open">
            <span>Open app</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="xp-hero xb-dark" aria-labelledby="proof-h">
          <BeamCanvas level={0.9} origin={[0.56, 0.36]} originMobile={[0.1, 0.66]} spread={0.5} />
          <div className="xp-wrap xp-hero-in">
            <div className="xp-hero-copy">
              <p className="xb-kicker">Receipts</p>
              <h1 id="proof-h" className="xp-h1">
                Everything Xenia says, <span>with receipts you can check</span>
              </h1>
              <p className="xp-lead">
                Memories saved, payments settled, cards taken back. Each one comes with an id you can copy and look up yourself.
                Nothing private is shown here: no keys, no secrets.
              </p>
              <nav className="xp-tabs xb-segs" aria-label="On this page">
                <a href="#memories" className="xb-seg">Memories</a>
                <a href="#payments" className="xb-seg">Payments</a>
                <a href="#visits" className="xb-seg">Visits</a>
                <a href="#checks" className="xb-seg">How we check</a>
              </nav>
            </div>
            <Suspense fallback={<StatsSkeleton />}>
              <Stats />
            </Suspense>
          </div>
        </section>
        <Suspense
          fallback={
            <div className="xp-wrap">
              <p className="xp-skel" role="status">Gathering the receipts…</p>
            </div>
          }
        >
          <Evidence />
        </Suspense>
        <section className="xp-sec xp-sec-dark xb-dark" aria-labelledby="checks-h" id="checks">
          <div className="xp-wrap">
            <SectionHead
              tag="How we check"
              id="checks-h"
              lead="Xenia reads Sui mainnet through Tatum’s gateway with three calls. That is all it asks the chain."
            >
              Three questions we ask Sui
            </SectionHead>
            <ul className="xp-checks">
              {CHECKS.map(([q, a, rpc], i) => (
                <li key={rpc} className="xp-check">
                  <span className="xp-check-n" aria-hidden>0{i + 1}</span>
                  <h3>{q}</h3>
                  <p>{a}</p>
                  <code>{rpc}</code>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <footer className="xp-foot">
        <div className="xp-wrap xp-foot-in">
          <span>Memories on Walrus. Payments on Sui.</span>
          <Link href="/">Back to Xenia</Link>
        </div>
      </footer>
    </div>
  );
}
