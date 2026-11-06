import Image from "next/image";
import Link from "next/link";
import "./landing.css";
import { IMAGES, type ImageKey } from "@/lib/images";
import { ArrowRight, Wordmark, XMark } from "@/components/landing/Brand";
import { HeroBeam } from "@/components/landing/HeroBeam";
import { Motion } from "@/components/landing/Motion";
import { OrbitSteps } from "@/components/landing/OrbitSteps";
import { TakeBack } from "@/components/landing/TakeBack";

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Who it’s for" },
  { href: "#privacy", label: "Privacy" },
  { href: "/proof", label: "Receipts" },
];

const STEPS = [
  { t: "Tell it once", d: "Write down how you like things, in your own words. It stays yours." },
  { t: "Share for one visit", d: "Scan the code at the counter. The shop sees your card while you are there." },
  { t: "Pay and settle", d: "Pay in USDC from your own wallet. The tab settles once the payment is checked." },
  { t: "Take it back", d: "When you leave, take your card back. The counter screen goes blank." },
];

type Place = {
  key: ImageKey;
  name: string;
  x: number;
  y: number;
  remembers: string;
  next: string;
};

// Positions are percentages of the map, on three orbits around "you" at 50% / 50%.
const PLACES: Place[] = [
  { key: "barber", name: "Barber", x: 63.8, y: 35.9, remembers: "Skin fade, number 2 on the sides. Sensitive scalp.", next: "The right guard is out before you sit down." },
  { key: "pharmacy", name: "Pharmacy", x: 34.4, y: 61, remembers: "You prefer to be asked things at the quiet end of the counter.", next: "Fewer questions said out loud." },
  { key: "garage", name: "Garage", x: 19.9, y: 37.3, remembers: "Which car is yours, and to call before any repair over a set amount.", next: "No walking them through the history again." },
  { key: "tailor", name: "Tailor", x: 80.1, y: 62.7, remembers: "Your measurements, and that you like trousers a little shorter.", next: "They start from your notes, not from scratch." },
  { key: "cornerShop", name: "Corner shop", x: 47.2, y: 86.9, remembers: "Oat milk, the Saturday paper, and that you settle up on Fridays.", next: "Your usual is ready when you walk in." },
  { key: "gym", name: "Gym", x: 68.6, y: 9.2, remembers: "An old knee injury, and that you like the early slot.", next: "The session is planned around the knee from the start." },
  { key: "florist", name: "Florist", x: 7.5, y: 61.6, remembers: "No lilies at home because of the cat. Seasonal stems please.", next: "They suggest something you would actually pick." },
];

const STACK = [
  {
    name: "Walrus",
    role: "Memory you own",
    facts: [
      "Your card is kept as memories through the Walrus Memory relayer, encrypted, in an account that belongs to you.",
      "Each visit gets a fresh key. Taking your card back removes that key.",
      "Saving takes around 30 seconds, so the app never makes you wait for it.",
    ],
  },
  {
    name: "Tatum",
    role: "Checks payments on Sui",
    facts: [
      "Reads each payment from Sui mainnet through Tatum’s gateway.",
      "Checks it went through and that enough USDC reached the shop.",
      "Each payment can settle a tab only once.",
    ],
  },
  {
    name: "Sui",
    role: "USDC settles",
    facts: [
      "You pay in USDC from your own wallet, on Sui mainnet.",
      "Sharing your card and taking it back are transactions your wallet signs.",
      "The shop’s tab settles only after the payment is checked.",
    ],
  },
];

const CREDITS = Array.from(
  new Set(Object.values(IMAGES).map((i) => i.credit.replace(/^Photo by | on Unsplash$/g, ""))),
).join(", ");

function tipSide(p: Place) {
  const h = p.x < 35 ? "l" : p.x > 65 ? "r" : "c";
  const v = p.y < 50 ? "b" : "t";
  return `xl-tip-${h} xl-tip-${v}`;
}

export default function Home() {
  return (
    <div className="xenia-landing" id="top">
      <Motion />

      {/* 1 HERO */}
      <header className="xl-frame xl-frame-hero">
        <div className="xl-hero">
          <HeroBeam />
          <div className="xl-hero-top">
            <a href="#top" className="xl-brand" aria-label="Xenia home">
              <Wordmark size={30} />
            </a>
            <nav aria-label="Primary" className="xl-segs">
              {NAV.map((n) =>
                n.href.startsWith("/") ? (
                  <Link key={n.href} href={n.href} className="xl-seg">{n.label}</Link>
                ) : (
                  <a key={n.href} href={n.href} className="xl-seg">{n.label}</a>
                ),
              )}
            </nav>
            <Link href="/customer" className="xl-btn xl-btn-white xl-btn-sm xl-hero-open">
              <span>Open app</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="xl-hero-copy">
            <h1 className="xl-h1">
              Be a regular <br className="xl-br" />
              everywhere.
            </h1>
            <p className="xl-hero-lead">
              Xenia is your personal guest card. It remembers how you like things, so the barber, the garage or the pharmacy already knows.
            </p>
            <div className="xl-hero-cta">
              <Link href="/customer" className="xl-btn xl-btn-white">
                <span>Make my card</span>
                <ArrowRight />
              </Link>
              <Link href="/shop" className="xl-note-link">
                <i aria-hidden="true" />
                See the counter screen
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 2 PROBLEM */}
        <section className="xl-frame xl-light" aria-labelledby="zero-h">
          <div className="xl-wrap">
            <div className="xl-head xl-head-split" data-reveal>
              <div>
                <p className="xl-kicker">The problem</p>
                <h2 id="zero-h" className="xl-h2">Every counter starts from zero.</h2>
              </div>
              <p className="xl-body">
                You have told the barber how you like it, and the garage which car is yours. Next time, or with someone new behind the counter, you say it all again.
              </p>
            </div>
            <div className="xl-compare">
              <figure className="xl-cmp xl-cmp-without" data-reveal>
                <figcaption><span className="xl-cmp-tag">Without Xenia</span></figcaption>
                <div className="xl-blank-card" aria-hidden="true">
                  <span className="xl-blank-q">?</span>
                  <span className="xl-blank-line" />
                  <span className="xl-blank-line xl-short" />
                  <span className="xl-blank-line" />
                  <span className="xl-blank-line xl-shorter" />
                </div>
                <p className="xl-cmp-quote">&ldquo;Sorry, how do you usually have it?&rdquo;</p>
              </figure>
              <figure className="xl-cmp xl-cmp-with" data-reveal style={{ ["--d" as string]: "120ms" }}>
                <figcaption><span className="xl-cmp-tag">With Xenia</span></figcaption>
                <div className="xl-cmp-beam" aria-hidden="true" />
                <span className="xl-beam-core" aria-hidden="true" />
                <div className="xl-mini-card">
                  <p className="xl-mini-top"><span>Guest card</span><span className="xl-live"><i aria-hidden="true" />Shared</span></p>
                  <p className="xl-mini-name">May</p>
                  <dl>
                    <div><dt>Your usual</dt><dd>Skin fade, number 2 on the sides</dd></div>
                    <div><dt>Important to know</dt><dd>Sensitive scalp</dd></div>
                  </dl>
                </div>
                <p className="xl-cmp-quote">&ldquo;The usual, May? Number 2 on the sides.&rdquo;</p>
              </figure>
            </div>
          </div>
        </section>

        {/* 3 HOW IT WORKS */}
        <section className="xl-frame" id="how" aria-labelledby="how-h">
          <div className="xl-panel xl-panel-how">
            <div className="xl-wrap">
              <div className="xl-head xl-head-dark" data-reveal>
                <p className="xl-kicker">How it works</p>
                <h2 id="how-h" className="xl-h2">One visit, four moments.</h2>
                <p className="xl-body">No app for the shop to install, and no account to make with them.</p>
              </div>
              <OrbitSteps steps={STEPS} />
            </div>
          </div>
        </section>

        {/* 4 GUEST CARD */}
        <section className="xl-frame xl-light" aria-labelledby="card-h">
          <div className="xl-wrap">
            <div className="xl-head" data-reveal>
              <p className="xl-kicker">Your guest card</p>
              <h2 id="card-h" className="xl-h2">How you like things, in one place.</h2>
            </div>
            <div className="xl-show">
              <div className="xl-show-stage" data-reveal data-loop>
                <div className="xl-show-beam" aria-hidden="true" />
                <span className="xl-beam-core" aria-hidden="true" />
                <div className="xl-show-orbit" aria-hidden="true" />
                <article className="xl-glass" aria-label="Example guest card, shared with Corner Barber">
                  <header className="xl-glass-top">
                    <span className="xl-glass-brand"><XMark size={14} /> Guest card</span>
                    <span className="xl-live"><i aria-hidden="true" />Shared</span>
                  </header>
                  <dl className="xl-glass-rows">
                    <div><dt>Goes by</dt><dd className="xl-glass-name">May</dd></div>
                    <div><dt>Your usual</dt><dd>Skin fade, number 2 on the sides</dd></div>
                    <div><dt>Important to know</dt><dd>Sensitive scalp. No clippers on the neck.</dd></div>
                    <div><dt>How you pay</dt><dd>USDC on Sui, from your own wallet</dd></div>
                  </dl>
                  <p className="xl-glass-status">Shared with Corner Barber until you leave</p>
                </article>
              </div>
              <div className="xl-show-lists">
                <div className="xl-list" data-reveal>
                  <h3>What the counter sees</h3>
                  <ul>
                    <li>Only the parts of your card you picked for this visit</li>
                    <li>Your usual, and anything important to know</li>
                    <li>Whether your payment has been checked</li>
                  </ul>
                </div>
                <div className="xl-list xl-list-dim" data-reveal style={{ ["--d" as string]: "100ms" }}>
                  <h3>What stays with you</h3>
                  <ul>
                    <li>Everything you did not pick for this visit</li>
                    <li>Your wallet and its keys</li>
                    <li>The choice to take your card back at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 CONSTELLATION */}
        <section className="xl-frame" id="who" aria-labelledby="who-h">
          <div className="xl-panel xl-panel-map">
            <div className="xl-wrap">
              <div className="xl-head xl-head-dark xl-head-split" data-reveal>
                <div>
                  <p className="xl-kicker">Who it&rsquo;s for</p>
                  <h2 id="who-h" className="xl-h2">One card, many counters.</h2>
                </div>
                <p className="xl-body">
                  Anywhere you come back to. Each place sees only what matters to it, and only while you are there. Hover or tap a place to see what it would remember.
                </p>
              </div>
              <div className="xl-map" data-loop>
                <svg className="xl-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <ellipse cx="50" cy="50" rx="18" ry="22" />
                  <ellipse cx="50" cy="50" rx="32" ry="37" />
                  <ellipse cx="50" cy="50" rx="44" ry="45" />
                  {PLACES.map((p) => (
                    <line key={p.key} x1="50" y1="50" x2={p.x} y2={p.y} className={`xl-ray xl-ray-${p.key}`} />
                  ))}
                </svg>
                <div className="xl-map-drift" aria-hidden="true">
                  <i /><i /><i />
                </div>
                <div className="xl-map-you" aria-hidden="true"><i /><span>You</span></div>
                <ul className="xl-map-nodes">
                  {PLACES.map((p) => (
                    <li key={p.key} className={`xl-node ${tipSide(p)}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} data-place={p.key}>
                      <button type="button" className="xl-node-btn" aria-describedby={`tip-${p.key}`}>
                        <span className="xl-node-img">
                          <Image src={IMAGES[p.key].src} alt={IMAGES[p.key].alt} width={112} height={112} className="xl-duo" />
                        </span>
                        <span className="xl-node-name">{p.name}</span>
                      </button>
                      <div className="xl-tip" id={`tip-${p.key}`} role="tooltip">
                        <p className="xl-tip-h">{p.name}</p>
                        <p><b>Remembers</b> {p.remembers}</p>
                        <p><b>Next visit</b> {p.next}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6 TAKE IT BACK */}
        <section className="xl-frame xl-light" id="privacy" aria-labelledby="privacy-h">
          <div className="xl-wrap xl-privacy">
            <div className="xl-privacy-copy" data-reveal>
              <p className="xl-kicker">Privacy</p>
              <h2 id="privacy-h" className="xl-h2">Take it back.</h2>
              <p className="xl-body">Your card is lent, never handed over. When you leave, the light goes out.</p>
              <ul className="xl-facts">
                <li>You choose what to share, for each visit.</li>
                <li>When you take it back, access is cut within about 30 seconds. We have not measured that yet.</li>
                <li>What a shop already saw can&rsquo;t be unseen, just like anything said across a counter.</li>
                <li>Your memory is encrypted and stored on Walrus. It belongs to you, not to the shop.</li>
              </ul>
            </div>
            <div data-reveal style={{ ["--d" as string]: "120ms" }}>
              <TakeBack />
            </div>
          </div>
        </section>

        {/* 7 UNDER THE HOOD */}
        <section className="xl-frame" aria-labelledby="hood-h">
          <div className="xl-panel xl-panel-hood" data-loop>
            <div className="xl-wrap">
              <div className="xl-head xl-head-dark" data-reveal>
                <p className="xl-kicker">Under the hood</p>
                <h2 id="hood-h" className="xl-h2">Three pieces, plainly.</h2>
                <p className="xl-body">
                  Want the evidence? <Link href="/proof" className="xl-inline">See the receipts</Link>.
                </p>
              </div>
              <ol className="xl-hood">
                {STACK.map((s, i) => (
                  <li key={s.name} data-reveal style={{ ["--d" as string]: `${i * 110}ms` }}>
                    <div className="xl-hood-node" aria-hidden="true"><i /></div>
                    <h3>{s.name}<span>{s.role}</span></h3>
                    <ul>
                      {s.facts.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 8 CTA */}
        <section className="xl-frame" aria-labelledby="cta-h">
          <div className="xl-panel xl-panel-cta">
            <HeroBeam variant="cta" />
            <div className="xl-cta-copy" data-reveal>
              <h2 id="cta-h" className="xl-h1 xl-h1-cta">Walk in. Already known.</h2>
              <p className="xl-hero-lead">Make your card in a minute, then just walk in.</p>
              <div className="xl-hero-cta">
                <Link href="/customer" className="xl-btn xl-btn-white">
                  <span>Make my card</span>
                  <ArrowRight />
                </Link>
                <Link href="/shop" className="xl-note-link">
                  <i aria-hidden="true" />
                  See the counter screen
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="xl-foot">
        <div className="xl-foot-in">
          <a href="#top" className="xl-foot-brand" aria-label="Xenia, back to top">
            <Wordmark size={20} />
          </a>
          <p>xenia · Memory on Walrus. Payments checked through Tatum. Runs on Sui mainnet.</p>
          <nav aria-label="Footer" className="xl-foot-nav">
            <Link href="/customer">Make my card</Link>
            <Link href="/shop">Counter screen</Link>
            <Link href="/proof">Receipts</Link>
          </nav>
          <p className="xl-credit">Photos from Unsplash by {CREDITS}.</p>
        </div>
      </footer>
    </div>
  );
}
