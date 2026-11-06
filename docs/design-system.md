# Xenia design system ("Pallet" direction)

Retuned to the owner's reference (Pinterest pin 893331276096299450, a screen recording of the "Pallet Ross" site; frame in `docs/reference/pallet-ross-grid-frame.jpg`). Clean white page, near-black ink, tight Geist type, small black pill buttons, and vivid colour that lives in the **cards**, never the page. Light only. Review page: `/design`.

## Files
- `src/styles/guest.css`: tokens (`--g-*`) and `.g-*` classes. Loaded globally from `layout.tsx`.
- `src/components/guest/`: typed React components, import from `@/components/guest`.
- Font: Geist only (next/font, `--font-geist-sans`). `guest.css` maps `--font-display` and `--font-body` to it. Fraunces and DM Sans were removed.
- Wrap a page in `<main className="g-page">` for the white background and body type.

## Tokens
- Page white `#ffffff`, soft surface `#f5f5f2`, ink `#0b0b0b`, muted `#6b6b66`, hairline `#e7e7e2`.
- Brand green `#1f8a4c` (handles, success, accent button). Card colours: lime `#c9f27a`, yellow `#f7ef4a`, orange `#ff6a2b`, coral `#ff8fa0`, sky `#8ec5ff`, lilac `#c9b8ff`, cream `#f6f0e4`.
- Important to know: bg `#ffe4d6`, ink `#5c1d00`, orange dot. Danger `#c0262d`.
- Legacy names (`--g-paper`, `--g-sage`, `--g-butter*`, `--g-coral-*`, `--g-dash`, `--g-ink-2/3`, `--g-green-deep`) still exist as aliases of the new palette so older page CSS keeps working. Prefer the new names.
- Radius: 12 / 16 / 24 / 28 (`--g-r-xl`) / pill. Cards 20 to 32px.
- Shadows: neutral only, `--g-shadow-2` = `0 12px 32px rgba(0,0,0,.08)`.
- Type: display 600 at -0.04em, h1 600 at -0.03em, h2 600 at -0.02em, body 16px. Sentence case. No serif, no italics.
- Motion: 140 / 260 / 520ms. Everything (card entry, hover lift/tilt, marquee, stamp) is off under `prefers-reduced-motion`.

## Components (all props from the first pass still work; additions marked +)
- `GuestCard {data, variant: full|compact|large|+counter-large, state: ready|loading|empty|shared|revoked, sharedWith, footer, emptyAction, +tone, +art, +handle, +tilt}`
  - `tone`: green | lime | yellow | orange (default) | coral | sky | lilac | cream | ink.
  - `art`: ReactNode framed at the top (img, svg, an Illustration). Without art an avatar is shown.
  - `handle`: green speech-bubble tag, e.g. `"@maya"`.
  - `tilt`: resting rotation in degrees (fans, heroes).
  - Rows "Your usual / How you pay / Notes" and the "Important to know" note sit on a white inner panel so text contrast never depends on the card colour.
- `Button {variant: primary (black)|secondary (white, hairline)|quiet|danger|+accent (green)|+lime, size: sm|md|lg, block, loading}`, `LinkButton` (same)
- `Chip {tone: sage|butter|coral|ink|+lime|+yellow|+orange|+sky|+lilac|+cream|+green, icon}`, `ChipButton {pressed}` (pressed = black)
- `StatusPill {status: shared|idle|revoked|warn}`
- `Stamp {tone: green|coral, animate}`: now a tilted sticker pill (coral tone renders ink with a coral dot).
- `Avatar {name, size, tone}`
- `SectionTitle {children: "Be a *regular* everywhere.", eyebrow, as, size, lead, +align: start|center}`: the `*word*` gets a lime marker, not italics.
- `Card {variant: default|flat|paper|stitched, lift, +tone}`: `stitched` is neutralised (soft panel, solid hairline). `tone` gives pricing / featured cards.
- `Note {title}`, `Rows {items}`, `Divider` (solid hairlines)
- `Field`, `TextArea {id, label, hint, error}`
- `TabBar {tabs, value, onChange, label}`: segmented pill, selected tab black.
- `Toast {tone, onClose}`, `ToastRegion`
- + `HandleTag {children, tone: green|ink|lime}`, + `Marquee {items, label}` (yellow band), + `CardFan {children}` (overlapping tilted cards)
- Illustrations: `Sprig, Tag, Bookmark, Ticket, Key, HandCard` ({size, title}), recoloured: ink outlines, vivid fills.

## Rules
Do: white page; colour on cards only; one featured orange card per group; black pill for the one primary action; sentence case; 44px touch targets; plain words.
Don't: tinted or textured page backgrounds, paper grain, dashed "stitched" borders, serif or italic accents, warm brown shadows, glow, mono uppercase labels, more than one vivid colour on a single small element.

## Voice and tone
Talk like a friendly regular at the counter: short, plain, kind, honest about money and access.
1. "Be a regular everywhere."
2. "Tell Xenia how you like things."
3. "Share your card for this visit."
4. "Shared with Corner Barber until you leave."
5. "You pay in USDC. Your tab settles when you are done."
6. "Taken back. Corner Barber can no longer see your card."
7. "That did not go through. Nothing was charged."
8. "Anything they should know before they start?"

## Known conflicts
- Page CSS (`landing.css`, `customer.css`, `shop.css`, `proof.css`) belongs to other agents; it may still set italic `em`, warm shadows or dashed borders locally. Those override the system on that page only.
- `globals.css` keeps the old Tailwind colour names (`bg-paper`, `text-clay`, ...) but their values are retuned to the new palette; `--font-serif` now resolves to Geist.
