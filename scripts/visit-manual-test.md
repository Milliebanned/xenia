# Manual end-to-end test: grant and revoke a shop delegate key (mainnet)

Why manual: only the account OWNER wallet can call add/remove_delegate_key. The server never holds the
owner key, so this cannot be automated. Needs a browser wallet (Slush / Sui Wallet) that owns the Walrus
Memory account in `MEMWAL_ACCOUNT_ID`, with a little SUI for gas (two small transactions).

Already verified without a wallet (read-only): `npx tsx scripts/visit-readonly-check.mts`

## Option A: with curl + a wallet page (no UI needed)
Run `npm run dev`. Until the UI agent wires `<Providers>` and a button, use Option B.

1. Create the visit (server generates the shop key, keeps the private half in `.data/visits.json`):
   `curl -s -X POST localhost:3000/api/visit/create -H 'content-type: application/json' -d '{"shopId":"demo-cafe","customerAccountId":"<MEMWAL_ACCOUNT_ID>"}'`
   Expect `session.status:"pending"`, a `walletAction` and `qr`. Confirm the response contains NO private key.

## Option B: from a page that uses the wallet layer
In any client component under `<Providers>`:
```tsx
const { walletSigner, suiClient } = useOwnerSigner();
const v = await (await fetch("/api/visit/create", {method:"POST", body: JSON.stringify({shopId:"demo-cafe", customerAccountId})})).json();
const digest = await grantDelegateKey(walletSigner!, suiClient, v.walletAction);   // wallet popup #1
const s = await (await fetch("/api/visit/grant-confirm", {method:"POST", body: JSON.stringify({visitId:v.session.id, digest})})).json();
```

## Steps and what to check
1. Connect the OWNER wallet (address must equal `ownerAddress` in the response; `grantDelegateKey` refuses otherwise).
2. Approve the add_delegate_key transaction (popup #1). `grantDelegateKey` returns the digest.
3. POST `/api/visit/grant-confirm {visitId, digest}`. Blocks up to 60s while polling the relayer list.
   Expect `session.status:"active"` and `timings.grantListedMs`. Paste `timings.evidence[0]`.
4. POST `/api/visit/shop-recall {visitId, query:"how do I like my coffee"}`. Expect `facts` (profile facts that
   exist in the account's profile namespace; env `VISIT_PROFILE_NAMESPACE`, default `MEMWAL_NAMESPACE`).
   If the account has no memories yet the list is empty but the call must succeed (HTTP 200).
5. POST `/api/visit/revoke-start {visitId}`. Expect `status:"revoking"` and a `walletAction`.
6. `revokeDelegateKey(walletSigner, suiClient, walletAction)` (popup #2) returns the digest.
7. POST `/api/visit/revoke-confirm {visitId, digest}`. Blocks (up to ~60s for list removal + up to 90s of
   recall probes every 2s). Expect `session.status:"revoked"` and:
   - `timings.keyRemovedFromListMs`: digest -> key gone from relayer delegate-keys list
   - `timings.shopRecallDeniedMs`: digest -> shop recall rejected with HTTP 401 AUTH_REJECTED (the "~30s" claim)
   - `timings.deniedAfterListMs`, `timings.recallProbes`
   - `timings.evidence[]`, also printed in the server console as `[visit-evidence] ...`
   Paste the `evidence` lines. If `shopRecallDeniedMs` is `null`, the relayer still accepted the key inside
   the window: report that as-is (it contradicts the claim).
8. POST `/api/visit/shop-recall` again: expect HTTP 409 (visit revoked), and `curl .../api/visit/state?visitId=...`
   shows `revoked`.
9. Independent check of the list:
   `curl -s https://relayer.memory.walrus.xyz/api/accounts/<ownerAddress>/delegate-keys` must no longer list `publicKey`.
10. Optional forward-only check: remember that previously read facts are not unread; the shop's key can no
    longer read, but data it already fetched is out of our control.

Cleanup: each test leaves one visit record in `.data/visits.json` (gitignored). The per-visit key is removed from
the account by step 7; nothing else on-chain is left behind.
