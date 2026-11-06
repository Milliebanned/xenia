# Be a regular everywhere: building Xenia on Walrus Memory and Tatum

*Draft. Every [PLACEHOLDER] must be replaced with a real number, screenshot or timing from running the demo. Delete this line before publishing.*

Every small shop learns you from scratch. The barber, pharmacy or garage that knows you keeps it in someone's head or a notebook, and the moment you walk into a different one you are a stranger again. We wanted to flip that: you own the memory, and a shop borrows it for the length of a visit.

We built Xenia for the Tatum x Walrus Total Recall hackathon. The name is Greek for guest-friendship, the bond where a host remembers the guest and the guest is welcomed back.

## What it does

You tell the customer app how you like things in plain words: your usual, something important to know, that you settle your tab on Fridays. Walrus Memory's `analyze` turns that into short facts and stores them. At the shop, you scan a QR code. Your wallet signs a transaction that adds a per-visit delegate key to a shareable profile account, and the counter screen shows your preferences straight away. You pay in USDC on Sui from your own wallet. We confirm the payment through Tatum and the shop's tab settles. When you leave, you remove the key and the screen goes blank.

[PLACEHOLDER: screenshot of the counter screen before and after the scan]

## How we use Walrus Memory

Memories are written as dated sentences ("[date] Usual order: ..."), because Walrus memories are immutable and we needed a way to say that something changed. Our app decides that the newest fact of a kind wins and flags older ones as superseded, while keeping them as evidence. Each suggestion on screen lists the memories that caused it.

Two design decisions came from friction we hit. Delegate keys are not scoped to a namespace, so we split each customer into two accounts: a shareable profile account that a shop can get a key for, and a private one it never sees. And because revoking should be routine, every visit gets its own key.

Writes take around 30 seconds, so nothing in the UI waits on them. We wrap the SDK in one adapter with our own timeouts, idempotency keys, and a point limiter that stays under the relayer's 60 points per minute.

[PLACEHOLDER: number of mainnet memories written at publication time, from /proof]

## How we use Tatum

Payment verification goes through Tatum's Sui gRPC endpoint. A payment is accepted only if `GetTransaction` for the digest shows a successful transaction that credited our shop address with at least the expected USDC; the payee comes from server config, never from the client. Each digest can settle a tab once. We also use `ListBalances` to show a customer's balance. Two things we learned: Tatum needs the native gRPC transport rather than grpc-web from Node, and the free plan allows 3 requests per second, so we serialize calls and back off on 429s.

[PLACEHOLDER: one verified payment digest and its suiscan link]

## Revoking, honestly

Revocation is forward-only. Removing the key stops the shop's future reads through the relayer, but it cannot unread what the shop already saw. We measure rather than assume how long the relayer takes to reject the old key.

[PLACEHOLDER: measured grant-listed time, key-removed-from-list time and shop-recall-rejected time from /proof. Do not publish a number that is not on that page.]

## How it learned over time

[PLACEHOLDER: describe the real sequence of visits and people involved, and how many.]

- Usual change: [PLACEHOLDER: before text, after text, which memory superseded which]
- Payment rhythm: [PLACEHOLDER: the habit fact Xenia derived after 3+ payments, with dates]
- A suggestion that got sharper: [PLACEHOLDER: before and after suggestion, with the memories shown as its cause]
- Something it got wrong: [PLACEHOLDER: honest example]

## What we would tell the Walrus Memory team

Recall distance depends heavily on phrasing, so we word our probes like the stored text. Namespaces are not access boundaries. Immutability means supersession is the app's job. The relayer's public config and delegate-key listing endpoints were what let us observe grant and revoke at all.

## Try it

[PLACEHOLDER: repo link] · [PLACEHOLDER: demo video link] · [PLACEHOLDER: /proof page link]
