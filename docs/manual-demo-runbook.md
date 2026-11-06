# Manual demo runbook (real mainnet, real wallet)

Prerequisites: Chrome with Slush (or Sui Wallet) holding the OWNER key of the Walrus Memory account in `MEMWAL_ACCOUNT_ID`
(owner address is shown in "My code"). The wallet needs a little SUI for gas (about 3 transactions) and at least 0.01 USDC
(native Sui USDC `0xdba3...::usdc::USDC`) for the payment. Pre-existing facts are already stored (usual, important, goes-by). Honest note: the 3 real memories stored on mainnet are coffee-related test data; they cannot be deleted.

Namespace note: facts are written under `MEMWAL_NAMESPACE` (xenia-profile); shop recall uses `VISIT_PROFILE_NAMESPACE`, falling back
to `MEMWAL_NAMESPACE`, then "xenia-profile". Leave `VISIT_PROFILE_NAMESPACE` unset and they are identical.

## 0. Start
`npm run build && npx next start -p 3000` (or `npm run dev` if no other dev server owns this project). Open two browser windows side by side:
A = http://localhost:3000/customer (wallet installed), B = http://localhost:3000/shop. No "Demo data" badge may be visible.
Start a screen recording now. Keep the terminal visible: the server prints `[visit-evidence] ...` lines.

## 1. Customer: connect and show the code
In A click "Connect Wallet", pick the wallet, approve. Wallet address must equal the Owner shown in the "My code" card
(otherwise a red warning appears). Screenshot the page: memory facts with Walrus blob ids + "My code".

## 2. Shop: start the visit
In B click "Use demo customer" then "Create visit code". Expect a QR and the visit code text ("Show the full text").
Click the copy chip. Screenshot.

## 3. Customer: grant (wallet popup 1)
In A paste the visit code into "Visit a shop". The card shows shop and key prefix. Click "Grant access for this visit".
Wallet asks to approve a Move call `add_delegate_key` (gas only). Approve. UI then waits up to 60 s for the relayer to list the key.
Expected: card "Shop has access" (Live), grant digest chip. Copy the evidence line from the terminal:
`[visit-evidence] grant: key xxxxxxxx.. listed by relayer N ms after digest ... was submitted`.

## 4. Shop: the screen knows the customer
B switches within ~2 s (profile reads can take a few seconds) to the big profile: Goes by, IMPORTANT TO KNOW (red), their usual.
Screenshot this. If it says "No profile facts found", the namespace or relayer read failed; check the terminal.

## 5. Tab and payment (wallet popup 2)
In B add a charge (e.g. preset). A tab entry of 0.01 USDC "integration test" already exists from testing; either pay it
as is or settle it first. In A the "Your tab" card appears. Click "Pay X USDC": a confirmation box shows the EXACT amount and the
payee address (must equal SHOP_SUI_ADDRESS). Click "Confirm and sign". Wallet shows a USDC transfer; approve.
Expected: "Confirming the payment on Sui via Tatum", then "Payment confirmed" + digest chip; B shows "Payment confirmed" overlay and Tab clear.
If verification says "not found" it retries 5 times (3 s apart); a lag is normal. Copy the digest and check it on suiscan.

## 6. Revoke and timing test (wallet popup 3)
In A click "Revoke access". Wallet approves `remove_delegate_key`. Immediately after approving, look at B: the counter screen
must go to "Access ended" (it reacts to status "revoking" and to a rejected shop recall). A shows "Measuring ..." for up to ~2.5 min,
then the "Access ended" card with measured timings:
- revoke digest -> key gone from relayer list
- revoke digest -> shop recall rejected (this is the "~30 s" claim; if it says "never rejected within the window", report that honestly)
- recall probes
Copy the evidence lines from A and the terminal: `[visit-evidence] revoke: key removed from relayer list ...`.
Independent check: `curl -s https://relayer.memory.walrus.xyz/api/accounts/<ownerAddress>/delegate-keys` must not list the visit public key.
Also `curl localhost:3000/api/visit/shop-recall -d '{"visitId":"<id>","query":"Usual order"}' -H 'content-type: application/json'` must now answer 409.

## 7. Caveats to say out loud
Revocation is forward-only (already-read data cannot be unread). The shop screen goes blank on "revoking" immediately, before the relayer
has actually rejected the key; the measured timing in step 6 is what proves the cutoff. Anyone can POST charges to /api/tab/charge (hackathon scope).

## Evidence to keep
Grant digest, revoke digest, payment digest, three evidence lines, screenshots of steps 1-6, the recording, the `/proof` page once updated.
