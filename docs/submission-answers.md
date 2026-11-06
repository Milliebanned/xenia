# Submission answers (draft)

Items marked [UNVERIFIED] or [PLACEHOLDER] need a human check before submitting.

## Project description
Xenia (be a regular everywhere) is a consumer finance app where the customer owns a portable memory of how they like things and lends it to a shop for one visit. Preferences are extracted and stored with Walrus Memory (`analyze`, `remember`, `recall`). At the shop the customer scans a QR code and grants a per-visit delegate key on a shareable profile account; the counter screen shows the preferences. The customer pays USDC on Sui from their own wallet and the payment is verified with Tatum's Sui gRPC `GetTransaction` before the tab settles. Revoking removes the key; the app measures how long the relayer takes to reject the shop. Revocation is forward-only and we say so. Evidence at `/proof`.

## Links
- Repo: [PLACEHOLDER]
- Demo video: [PLACEHOLDER]
- Blog post: [PLACEHOLDER] (draft: docs/blog-draft.md)
- Social post tagging @Tatum_io and @WalrusFoundation: [PLACEHOLDER]
- Tatum account ID: from `TATUM_ID` in .env.local (not recorded here)
- Walrus Memory account/agent id: `MEMWAL_AGENT_ID` in .env.local (not recorded here)

## Walrus experience feedback
- Writes take around 30 s; we designed all write paths as async job polling.
- Recall distance is sensitive to phrasing (a probe worded like the stored text scored about 0.18, a bare word about 0.52 in our mainnet tests); no cutoff guidance beyond "~0.5 is noisy" was easy to find.
- Namespaces are not access boundaries and delegate keys are not namespace-scoped; we needed two accounts to isolate shareable data.
- Memories are immutable, so supersession must be built in the app.
- The relayer's `/config` and delegate-keys endpoints helped us observe grant and revoke.
- Friction: recall hang risk (issue #1367), restore timestamp issue (#1060), account helpers need a funded owner key (#1034). [UNVERIFIED: issue numbers and their status should be re-checked against the repo before submitting.]
- A 401 `AUTH_REJECTED` is ambiguous when the account ID given is actually a wallet address rather than the MemWalAccount object id.
- Beta SDK (0.1.x); we wrapped it in one adapter.

## Tatum AI Builder experience
We did not use Tatum AI Builder. [Update this if that changes.] We used the Tatum Sui gRPC gateway directly.

## Tatum feedback / bugs / friction
- Native gRPC works; grpc-web did not work for us from Node, so we use `@grpc/grpc-js` with `GrpcTransport`.
- Sui JSON-RPC is deprecated, so gRPC was the right path.
- We found no documented history-by-address endpoint; we verify by digest instead.
- Free plan limit 3 requests/s; 429 arrives as UNAVAILABLE with "HTTP status code 429", so we rate-limit and back off.

## Mainnet evidence
Number of mainnet memories and verified digests: [PLACEHOLDER: copy from /proof at submission time]
