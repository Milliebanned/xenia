import type { Metadata } from "next";
import {
  Avatar, Button, Card, CardFan, Chip, Divider, Field, GuestCard, HandleTag, ILLUSTRATIONS, LinkButton, Marquee, Note, Rows,
  SectionTitle, Stamp, StatusPill, TextArea, Toast, Bookmark, HandCard, Key, Sprig, Ticket,
  type GuestCardData, type GuestCardTone,
} from "@/components/guest";
import { InteractiveDemos } from "@/components/guest/DesignDemos";

export const metadata: Metadata = { title: "Design system · Xenia" };

const sample: GuestCardData = {
  name: "Maya Okafor",
  goesBy: "May",
  usual: "Skin fade, #2 on the sides",
  pay: "USDC on Sui, $5 tip",
  notes: "Prefers a quiet chair.",
  important: "Allergic to latex. Please use nitrile gloves.",
};

const swatches: Array<[string, string, string]> = [
  ["White", "#ffffff", "page"], ["Soft", "#f5f5f2", "quiet panels"], ["Ink", "#0b0b0b", "text, primary button"],
  ["Muted", "#6b6b66", "secondary text"], ["Hairline", "#e7e7e2", "borders, rows"], ["Green", "#1f8a4c", "brand, handle, success"],
  ["Lime", "#c9f27a", "chips, accent marker"], ["Yellow", "#f7ef4a", "marquee, cards"], ["Orange", "#ff6a2b", "featured card"],
  ["Coral", "#ff8fa0", "cards, chips"], ["Sky", "#8ec5ff", "cards, chips"], ["Lilac", "#c9b8ff", "cards, chips"],
  ["Cream", "#f6f0e4", "calm cards"], ["Important bg", "#ffe4d6", "Important to know"], ["Important ink", "#5c1d00", "Important text"],
];

const fan: Array<{ tone: GuestCardTone; name: string; art: React.ReactNode; handle?: string }> = [
  { tone: "coral", name: "Ola", art: <Sprig /> },
  { tone: "yellow", name: "Sam", art: <Ticket /> },
  { tone: "orange", name: "Maya", art: <HandCard />, handle: "@maya" },
  { tone: "green", name: "Jun", art: <Key /> },
  { tone: "sky", name: "Rae", art: <Bookmark /> },
];

const tones: GuestCardTone[] = ["orange", "green", "yellow", "coral", "sky", "lilac", "cream"];

function Block({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "56px 0", borderTop: "1px solid var(--g-hairline)" }}>
      {kicker && <p className="g-eyebrow" style={{ margin: "0 0 10px" }}>{kicker}</p>}
      <h2 className="g-h1" style={{ marginBottom: 28 }}>{title}</h2>
      {children}
    </section>
  );
}
const grid = { display: "grid", gap: 28, gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", alignItems: "start", justifyItems: "center" } as const;
const label = { margin: "0 0 10px" } as const;

export default function DesignPage() {
  return (
    <main id="main" className="g-page">
      <nav className="g-container" aria-label="Design system" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, fontSize: 14 }}>
        <b style={{ fontWeight: 600, letterSpacing: "-.02em", display: "inline-flex", gap: 8, alignItems: "center" }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 999, background: "var(--g-green)" }} /> Xenia
        </b>
        <LinkButton href="/customer" size="sm">Open app</LinkButton>
      </nav>

      <div className="g-container" style={{ paddingTop: 56, paddingBottom: 24 }}>
        <SectionTitle as="h1" size="display" align="center" eyebrow="Xenia design system"
          lead="White page, tight Geist type, colour that lives in the cards. Everything here is built from src/components/guest.">
          Be a *regular* everywhere.
        </SectionTitle>
        <div className="g-row-flex" style={{ marginTop: 28, justifyContent: "center" }}>
          <Button>Make my card</Button>
          <Button variant="secondary">See how it works</Button>
        </div>
        <CardFan>
          {fan.map((f) => (
            <GuestCard key={f.name} variant="compact" tone={f.tone} art={f.art} handle={f.handle} data={{ name: f.name }} />
          ))}
        </CardFan>
      </div>

      <Marquee items={["Your usual, remembered", "Share for one visit", "Pay in USDC on Sui", "Take it back"]} />

      <div className="g-container">
        <Block kicker="Signature" title="Guest card">
          <div style={grid}>
            <div><p className="g-small" style={label}>Full, tone orange, art + handle</p><GuestCard data={sample} art={<HandCard />} handle="@maya" /></div>
            <div><p className="g-small" style={label}>Full, tone green, shared</p><GuestCard data={sample} tone="green" state="shared" sharedWith="Corner Barber" handle="@maya" /></div>
            <div><p className="g-small" style={label}>Compact, tone yellow</p><GuestCard data={sample} variant="compact" tone="yellow" art={<Ticket />} /></div>
          </div>
          <p className="g-small" style={{ ...label, marginTop: 40 }}>Counter-large (shown to the shop across the counter)</p>
          <div style={{ display: "grid", justifyItems: "center" }}>
            <GuestCard data={sample} variant="counter-large" state="shared" sharedWith="Corner Barber" art={<HandCard />} handle="@maya" />
          </div>
        </Block>

        <Block kicker="Guest card" title="States">
          <div style={grid}>
            <div><p className="g-small" style={label}>Not shared</p><GuestCard data={sample} tone="sky" /></div>
            <div><p className="g-small" style={label}>Shared</p><GuestCard data={sample} state="shared" sharedWith="Corner Barber" /></div>
            <div><p className="g-small" style={label}>Revoked</p><GuestCard data={sample} state="revoked" sharedWith="Corner Barber" /></div>
            <div><p className="g-small" style={label}>Loading</p><GuestCard state="loading" /></div>
            <div><p className="g-small" style={label}>Empty</p><GuestCard state="empty" tone="lilac" emptyAction={<Button>Make my card</Button>} /></div>
          </div>
        </Block>

        <Block kicker="Guest card" title="Tones">
          <div className="g-row-flex" style={{ gap: 20, alignItems: "start" }}>
            {tones.map((t, i) => (
              <div key={t} style={{ width: 200 }}>
                <p className="g-small" style={label}>{t}{i === 0 ? " (default)" : ""}</p>
                <GuestCard variant="compact" tone={t} data={{ name: "Maya" }} tilt={i % 2 ? 2 : -2} />
              </div>
            ))}
          </div>
        </Block>

        <Block kicker="Layout" title="Tabbed grid, pricing-style cards">
          <InteractiveDemos />
          <div style={{ ...grid, marginTop: 40, alignItems: "stretch" }}>
            {[
              { t: "Just me", p: "Free", d: "One card, any shop.", tone: undefined },
              { t: "Regular", p: "$0 fees", d: "Share for a visit, pay in USDC, take it back.", tone: "orange" as const },
              { t: "Shop", p: "1% per tab", d: "See the card while the guest is here.", tone: undefined },
            ].map((c) => (
              <Card key={c.t} tone={c.tone} lift style={{ width: "100%", display: "grid", gap: 14, padding: 28, borderRadius: 28 }}>
                <span className="g-small">{c.t}</span>
                <span className="g-h1">{c.p}</span>
                <span>{c.d}</span>
                <Button variant={c.tone ? "primary" : "secondary"} block>Choose</Button>
              </Card>
            ))}
          </div>
        </Block>

        <Block kicker="Type" title="Geist, tight and upright">
          <div className="g-stack">
            <p className="g-display">Display 600, -0.04em</p>
            <p className="g-h1">Heading one with a <em>marked</em> word</p>
            <p className="g-h2">Heading two, for cards and sections</p>
            <p>Body, Geist 16px. Your usual order, remembered, so you never have to explain it twice.</p>
            <p className="g-small">Small, 13px. Supporting detail and hints.</p>
          </div>
        </Block>

        <Block kicker="Tokens" title="Palette">
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {swatches.map(([n, c, u]) => (
              <div key={n} className="g-swatch">
                <div style={{ background: c, height: 72, borderBottom: "1px solid var(--g-hairline)" }} />
                <div style={{ padding: 10 }}><b style={{ fontSize: 14, fontWeight: 600 }}>{n}</b><div className="g-small">{c} · {u}</div></div>
              </div>
            ))}
          </div>
        </Block>

        <Block kicker="Actions" title="Buttons">
          <div className="g-row-flex">
            <Button>Share for this visit</Button>
            <Button variant="secondary">Edit my card</Button>
            <Button variant="quiet">Maybe later</Button>
            <Button variant="accent">Pay the tab</Button>
            <Button variant="lime">Add a note</Button>
            <Button variant="danger">Take it back</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Paying</Button>
            <LinkButton href="/customer" size="sm">Link button</LinkButton>
            <Button size="lg">Large</Button>
          </div>
        </Block>

        <Block kicker="Labels" title="Chips, handles, status, stamp, avatar">
          <div className="g-row-flex">
            <Chip>Regular</Chip><Chip tone="butter">Tab open</Chip><Chip tone="coral">Important</Chip><Chip tone="orange">Featured</Chip>
            <Chip tone="sky">Barber</Chip><Chip tone="lilac">Cafe</Chip><Chip tone="cream">Quiet</Chip><Chip tone="green">Verified</Chip><Chip tone="ink">New</Chip>
          </div>
          <div className="g-row-flex" style={{ marginTop: 20 }}>
            <HandleTag>@maya</HandleTag><HandleTag tone="ink">@cornerbarber</HandleTag><HandleTag tone="lime">@sam</HandleTag>
          </div>
          <div className="g-row-flex" style={{ marginTop: 20 }}>
            <StatusPill status="shared">Shared with Corner Barber until you leave</StatusPill>
            <StatusPill status="idle">Not shared</StatusPill>
            <StatusPill status="revoked">Access taken back</StatusPill>
            <StatusPill status="warn">Needs a quick look</StatusPill>
          </div>
          <div className="g-row-flex" style={{ gap: 32, marginTop: 28 }}>
            <Stamp>Shared · this visit only</Stamp>
            <Stamp tone="coral">Taken back</Stamp>
            <Avatar name="Maya" /><Avatar name="Sam" tone="green" /><Avatar name="Ola" tone="sage" size={64} />
          </div>
        </Block>

        <Block kicker="Surfaces" title="Cards, rows, note, divider">
          <div style={{ ...grid, justifyItems: "stretch" }}>
            <Card lift>
              <h3 className="g-h2">Default card</h3>
              <Rows items={[{ label: "Haircut", value: "$28" }, { label: "Tip", value: "$5" }]} />
              <Note>Please do not use clippers on the left side.</Note>
            </Card>
            <Card variant="paper"><h3 className="g-h2">Soft panel</h3><p className="g-small">Flat, for secondary info.</p><Divider /><p className="g-small">Divider above.</p></Card>
            <Card tone="yellow"><h3 className="g-h2">Toned card</h3><p className="g-small">tone=&quot;yellow&quot;, any card colour.</p></Card>
            <Card variant="stitched"><h3 className="g-h2">Stitched (neutralised)</h3><p className="g-small">Legacy variant, now a soft panel with a solid hairline.</p></Card>
          </div>
        </Block>

        <Block kicker="Input" title="Form fields">
          <div className="g-stack" style={{ maxWidth: 480 }}>
            <Field id="f1" label="What should we call you?" placeholder="Maya" hint="Shops see this name." />
            <Field id="f2" label="Phone" defaultValue="12" error="That looks a little short." />
            <TextArea id="f3" label="Anything worth knowing?" placeholder="Allergies, how you like things, what to avoid." />
          </div>
        </Block>

        <Block kicker="Feedback" title="Toast">
          <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
            <Toast>Shared with Corner Barber for this visit.</Toast>
            <Toast tone="error">That did not go through. Nothing was charged.</Toast>
          </div>
        </Block>

        <Block kicker="Art" title="Illustrations">
          <div className="g-row-flex" style={{ gap: 32 }}>
            {Object.entries(ILLUSTRATIONS).map(([n, I]) => (
              <figure key={n} style={{ margin: 0, textAlign: "center" }}><I size={72} /><figcaption className="g-small">{n}</figcaption></figure>
            ))}
          </div>
        </Block>
      </div>
    </main>
  );
}
