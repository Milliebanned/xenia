# Xenia: be a regular everywhere

Track 3 (Consumer Finance Apps) · Walrus Memory + Tatum Sui gRPC · Mainnet

*Xenia (ξενία): Greek for guest-friendship, the bond where a host remembers the guest and the guest is welcomed back.*

## The problem
Every small shop learns you from scratch, and informal tabs live in a notebook. Today any "remembering" is locked inside one shop's own system.

## The product
1. **You own your memory.** In the customer app you say how you like things ("skin fade, number 2 on the sides, sensitive scalp, I settle my tab on Fridays"). Walrus Memory (`analyze`) extracts and stores the facts.
2. **At the shop, scan a QR code** and grant the shop a per-visit delegate key on your *shareable profile account*. The counter screen shows your preferences instantly.
3. **Pay in USDC on Sui.** You sign in your own wallet. Tatum confirms the payment landed (`GetTransaction` by digest) and the shop's tab updates.
4. **It learns.** Their usual, payment rhythm, changes over time. Suggestions and reminders get sharper, and the UI shows which memory caused each suggestion.
5. **Revoke.** Leave the shop and remove the key. The shop's reads through the relayer stop within ~30 seconds.

## Design decisions
- **Two accounts per customer.** A shareable profile account (goes by, usual, important to know, notes) is the only one a shop ever gets a key for. Private memory lives in a separate account. This works around delegate keys not being namespace-scoped.
- **Per-visit keys.** Revoking is routine, not exceptional.
- **Precise claims.** Revocation is forward-only: access via the relayer is cut within ~30 s; already-read data cannot be unread and old ciphertext is not re-encrypted. We say exactly that.
- **Non-custodial.** The user signs in their own wallet. Tiny USDC amounts.
- **Resilience.** One adapter around the SDK with our own timeouts, `rememberAndWait` + idempotency keys, dates inside memory text, throttled writes (relayer limit: 60 points/min).
- **Evidence.** A `/proof` page lists mainnet memory blob IDs and Tatum-verified digests. Real usage by 2-3 people; seed data is labelled.

## Demo moment (2-3 min)
Scan → the counter screen already knows your usual → pay → tab settles → revoke → the screen goes blank.

## Judging map
| Criterion | Weight | Where Xenia scores |
|---|---|---|
| Walrus + Tatum integration | 30% | User-owned memory, delegate keys, `analyze`, recall, payment verification via Tatum |
| Technical quality | 30% | Clean adapter, tests, verified digests, documented limits |
| Creativity | 20% | Merchant-side, user-owned portable memory (no entry found doing this) |
| Presentation | 20% | One clear arc, README, blog, `/proof` page |

## Submission checklist
- [ ] Walrus Memory writing on Mainnet, 10+ memories
- [ ] Tatum RPC used for onchain data
- [ ] Published blog post (what it does, how it uses Tatum + Walrus, how it learned over time)
- [ ] Working demo (2-3 min video) + public repo
- [ ] Share on X/LinkedIn tagging @Tatum_io and @WalrusFoundation
- [ ] Feedback fields (Walrus experience, AI Builder experience)
- Deadline: **10 Nov 2026, 17:00 UTC**

## Open items
- Verify delegate revocation behaviour at the relayer (Day 1 spike).
- Re-run overlap search before building and again on Day 4.
- Confirm Tatum gRPC works from Node with `SuiGrpcClient` + `x-api-key`.
