"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import "@/app/customer.css";
import * as api from "@/app/lib-client/api";
import { usePolling } from "@/app/lib-client/hooks";
import { WalletConnectButton } from "@/components/wallet";
import { BeamCanvas, Wordmark } from "@/components/beam";
import { CardHero, MyCard } from "@/components/customer-v2/MyCard";
import { ShowCard } from "@/components/customer-v2/ShowCard";
import { VisitSection } from "@/components/customer-v2/Visit";
import { buildCardData, goesByName } from "@/components/customer-v2/card-data";
import { Bubble, DemoBadge, PillTabs } from "@/components/customer-v2/ui";
import { shopName } from "@/components/customer-v2/shop-name";
import type { ProfileFact, Suggestion } from "@/lib/types";

type View = "memory" | "visit" | "tab";
const TABS: { id: View; label: string }[] = [
  { id: "memory", label: "My card" },
  { id: "visit", label: "Share" },
  { id: "tab", label: "Pay" },
];

export default function CustomerPage() {
  const [facts, setFacts] = useState<ProfileFact[] | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [factsErr, setFactsErr] = useState<string | null>(null);
  const [view, setViewRaw] = useState<View>("memory");
  const [liveShop, setLiveShop] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const setView = useCallback((v: View) => {
    setViewRaw(v);
    window.scrollTo({ top: 0 });
  }, []);

  const anySaving = facts?.some((f) => f.status === "saving") ?? false;
  usePolling(api.listFacts, anySaving ? 1500 : 8000, true, (f) => { setFacts(f); setFactsErr(null); }, (e) => setFactsErr(e.message));
  usePolling(api.getSuggestions, 5000, true, setSuggestions);

  const cardData = buildCardData(facts);
  const name = goesByName(facts);
  const closeCard = useCallback(() => setShowCard(false), []);

  const sub =
    facts === null ? "Getting your card ready." :
    liveShop ? `${shopName(liveShop)} can see your card right now.` :
    cardData ? "Be a regular everywhere. You decide who sees your card, and for how long." :
    "Tell Xenia how you like things once. Then any shop can treat you like a regular.";

  return (
    <div className="xb xenia-customer" data-live={liveShop ? "true" : undefined}>
      <div className="xc-app" inert={showCard}>
        <div className="xc-shell xb-dark">
          <header className={`xc-head is-${view}`}>
            <BeamCanvas
              level={facts === null ? 0.5 : liveShop ? 1 : cardData ? 0.82 : 0.55}
              origin={view === "memory" ? [0.045, 0.47] : [0.7, 0.4]}
              originMobile={view === "memory" ? [0.045, 0.47] : [0.7, 0.4]}
              orbitScale={view === "memory" ? 1 : 0.62}
              spread={0.42}
            />
            <div className="xc-top">
              <Link href="/" aria-label="Xenia home" className="xb-brand xc-brand">
                <Wordmark size={22} />
              </Link>
              <div className="xc-top-r">
                <DemoBadge />
                {!api.USE_MOCKS && <div className="xc-wallet"><WalletConnectButton /></div>}
              </div>
            </div>

            <div className="xc-greet">
              <h1 className="xc-hi">Hi {name ?? "there"}</h1>
              <p className="xc-greet-sub">
                {liveShop && <Bubble tone="ink" className="xc-greet-live">Shared</Bubble>}
                {sub}
              </p>
            </div>

            {view === "memory" && <CardHero facts={facts} liveShop={liveShop} onShowCard={() => setShowCard(true)} />}

            <nav className="xc-tabbar" aria-label="Sections">
              <PillTabs label="Customer app sections" tabs={TABS} value={view} onChange={(id) => setView(id as View)} />
            </nav>
          </header>

          <main id="main" className="xc-main">
            <div role="tabpanel" id="panel-memory" aria-labelledby="tab-memory" hidden={view !== "memory"} className="xc-panel">
              <MyCard
                facts={facts}
                error={factsErr}
                suggestions={suggestions}
                onLearned={(f) => setFacts((cur) => [...f, ...(cur ?? [])])}
              />
            </div>
            <VisitSection view={view} onLive={setLiveShop} goShare={() => setView("visit")} />
          </main>

          <footer className="xc-foot">Your card stays yours. Shops only see it while you let them.</footer>
        </div>
        {liveShop && <p className="xb-sr" role="status">A shop has access to your card.</p>}
      </div>
      {showCard && cardData && <ShowCard data={cardData} onClose={closeCard} />}
    </div>
  );
}
