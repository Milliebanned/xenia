import { describe, expect, it, vi } from "vitest";
import { createVisitService, isAuthRejection, type ShopMemwal, type VisitDeps } from "../service";
import { MemoryVisitStore } from "../store";
import { encodeQrPayload, parseQrPayload } from "../qr";
import { VisitError, type RelayerDelegateKeys } from "../types";

const ACCOUNT = "0x508b92c8f05816ad7a7683bf6f55ecacf7d2742efcb51a3d5c66db1c186ecb6f";
const OWNER = "0xf3e39f6193e473c3a0ceb072c950e545ce466208b13feefe550d2d2f54c457d9";
const PUB = "ab".repeat(32);
const PRIV = "SECRETPRIVATEKEY" + "cd".repeat(24);

/** Fake clock: sleep advances time, so polling loops finish instantly. */
function harness(over: Partial<VisitDeps> = {}) {
  let t = 1_000_000;
  const listed = { value: false };
  const recallMode = { value: "ok" as "ok" | "auth" | "neterr" };
  const recall = vi.fn(async () => {
    if (recallMode.value === "auth") throw Object.assign(new Error("401 from relayer"), { status: 401, serverCode: "AUTH_REJECTED" });
    if (recallMode.value === "neterr") throw new Error("fetch failed");
    return { results: [
      { blob_id: "b1", text: "Usual: flat white", distance: 0.2, created_at: "2026-11-05T00:00:00Z" },
      { blob_id: "b2", text: "noise", distance: 0.8 },
    ] };
  });
  const destroy = vi.fn();
  const fetchDelegateKeys = vi.fn(async (): Promise<RelayerDelegateKeys> => ({
    account_id: ACCOUNT,
    keys: listed.value ? [{ public_key: PUB.toUpperCase() }] : [{ public_key: "11".repeat(32) }],
  }));
  const sleep = vi.fn(async (ms: number) => { t += ms; });
  const log = vi.fn();
  const createMemwal = vi.fn((): ShopMemwal => ({ recall, destroy }));
  const deps: VisitDeps = {
    store: new MemoryVisitStore(),
    serverUrl: "https://relayer.test",
    profileNamespace: "profile",
    getConfig: async () => ({ packageId: "0xpkg", registryId: "0xreg" }),
    fetchDelegateKeys,
    resolveOwner: async () => OWNER,
    generateKey: async () => ({ privateKey: PRIV, publicKeyHex: PUB }),
    createMemwal,
    now: () => t,
    sleep,
    newId: () => "visit-1",
    log,
    ...over,
  };
  return { svc: createVisitService(deps), deps, listed, recallMode, recall, destroy, fetchDelegateKeys, sleep, log, createMemwal, advance: (ms: number) => { t += ms; } };
}

describe("createVisit", () => {
  it("returns pending session, public key, wallet action and QR; no private key", async () => {
    const h = harness();
    const r = await h.svc.createVisit({ shopId: "shop-1", customerAccountId: ACCOUNT });
    expect(r.session.status).toBe("pending");
    expect(r.session.delegatePublicKey).toBe(PUB);
    expect(r.walletAction).toMatchObject({ packageId: "0xpkg", registryId: "0xreg", accountId: ACCOUNT, publicKey: PUB, ownerAddress: OWNER });
    expect(parseQrPayload(encodeQrPayload(r.qr))).toEqual({ shopId: "shop-1", visitId: "visit-1", publicKey: PUB, accountId: ACCOUNT });
    expect(JSON.stringify(r)).not.toContain("SECRETPRIVATEKEY");
  });
  it("validates input", async () => {
    const h = harness();
    await expect(h.svc.createVisit({ shopId: "", customerAccountId: ACCOUNT })).rejects.toBeInstanceOf(VisitError);
    await expect(h.svc.createVisit({ shopId: "s", customerAccountId: "" })).rejects.toBeInstanceOf(VisitError);
  });
});

describe("grant", () => {
  it("polls until the key is listed then goes active (case-insensitive key match)", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    let calls = 0;
    h.fetchDelegateKeys.mockImplementation(async () => {
      calls++;
      return { account_id: ACCOUNT, keys: calls >= 3 ? [{ public_key: PUB.toUpperCase() }] : [] };
    });
    const s = await h.svc.confirmGrant("visit-1", "DIGEST1");
    expect(s.session.status).toBe("active");
    expect(s.session.grantDigest).toBe("DIGEST1");
    expect(s.timings.grantListedMs).toBe(4000);
    expect(calls).toBe(3);
    expect(h.log).toHaveBeenCalledWith(expect.stringContaining("[visit-evidence] grant:"));
  });
  it("times out to failed, then can be retried to active", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    const s = await h.svc.confirmGrant("visit-1", "D", { timeoutMs: 5000, intervalMs: 1000 });
    expect(s.session.status).toBe("failed");
    expect(s.lastError).toMatch(/not listed/);
    h.listed.value = true;
    expect((await h.svc.confirmGrant("visit-1", "D")).session.status).toBe("active");
  });
  it("retries through transient relayer errors", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    let n = 0;
    h.fetchDelegateKeys.mockImplementation(async () => {
      if (n++ < 2) throw new Error("503");
      return { account_id: ACCOUNT, keys: [{ public_key: PUB }] };
    });
    expect((await h.svc.confirmGrant("visit-1", "D")).session.status).toBe("active");
  });
  it("rejects an owner whose account differs from customerAccountId", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    h.fetchDelegateKeys.mockResolvedValue({ account_id: "0xother", keys: [{ public_key: PUB }] });
    await expect(h.svc.confirmGrant("visit-1", "D")).rejects.toMatchObject({ code: "mismatch" });
  });
  it("requires a digest and a known visit", async () => {
    const h = harness();
    await expect(h.svc.confirmGrant("nope", "D")).rejects.toMatchObject({ code: "not_found" });
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    await expect(h.svc.confirmGrant("visit-1", "")).rejects.toMatchObject({ code: "bad_request" });
  });
});

describe("shop recall", () => {
  it("is refused before grant", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    await expect(h.svc.recallAsShop("visit-1", "order")).rejects.toMatchObject({ code: "bad_state" });
    expect(h.createMemwal).not.toHaveBeenCalled();
  });
  it("uses the per-visit key + profile namespace and filters by distance", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    h.listed.value = true;
    await h.svc.confirmGrant("visit-1", "D");
    const r = await h.svc.recallAsShop("visit-1", "usual order");
    expect(h.createMemwal).toHaveBeenCalledWith({ key: PRIV, accountId: ACCOUNT, serverUrl: "https://relayer.test", namespace: "profile" });
    expect(r.facts).toEqual([{ text: "Usual: flat white", distance: 0.2, blobId: "b1", createdAt: "2026-11-05T00:00:00Z" }]);
    expect(JSON.stringify(r)).not.toContain("SECRETPRIVATEKEY");
  });
});

describe("revoke", () => {
  async function activeVisit() {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    h.listed.value = true;
    await h.svc.confirmGrant("visit-1", "G");
    return h;
  }
  it("startRevoke needs an active visit and returns the wallet action", async () => {
    const h = harness();
    await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT });
    await expect(h.svc.startRevoke("visit-1")).rejects.toMatchObject({ code: "bad_state" });
    h.listed.value = true;
    await h.svc.confirmGrant("visit-1", "G");
    const r = await h.svc.startRevoke("visit-1");
    expect(r.session.status).toBe("revoking");
    expect(r.walletAction.publicKey).toBe(PUB);
    expect(JSON.stringify(r)).not.toContain("SECRETPRIVATEKEY");
  });
  it("records list-removal and shop-recall-denied timings", async () => {
    const h = await activeVisit();
    await h.svc.startRevoke("visit-1");
    // key disappears from list after ~2 polls; recall is accepted twice then 401
    let polls = 0;
    h.fetchDelegateKeys.mockImplementation(async () => ({ account_id: ACCOUNT, keys: ++polls >= 3 ? [] : [{ public_key: PUB }] }));
    let probes = 0;
    h.recall.mockImplementation(async () => {
      if (++probes >= 3) throw Object.assign(new Error("401"), { status: 401, serverCode: "AUTH_REJECTED" });
      return { results: [] };
    });
    const s = await h.svc.confirmRevoke("visit-1", "R1", { intervalMs: 1000 });
    expect(s.session.status).toBe("revoked");
    expect(s.session.revokeDigest).toBe("R1");
    expect(s.session.revokedAt).toBeTruthy();
    expect(s.timings.keyRemovedFromListMs).toBe(2000);
    expect(s.timings.recallProbes).toBe(3);
    expect(s.timings.deniedAfterListMs).toBe(2000);
    expect(s.timings.shopRecallDeniedMs).toBe(4000);
    expect(s.timings.evidence.join("\n")).toMatch(/shop recall rejected \(HTTP 401 AUTH_REJECTED\) 4000ms after digest/);
    expect(h.destroy).toHaveBeenCalled();
    await expect(h.svc.recallAsShop("visit-1", "x")).rejects.toMatchObject({ code: "bad_state" });
  });
  it("non-auth recall errors do not count as denial", async () => {
    const h = await activeVisit();
    await h.svc.startRevoke("visit-1");
    h.fetchDelegateKeys.mockResolvedValue({ account_id: ACCOUNT, keys: [] });
    h.recallMode.value = "neterr";
    const s = await h.svc.confirmRevoke("visit-1", "R", { intervalMs: 1000, denyTimeoutMs: 3000 });
    expect(s.session.status).toBe("revoked");
    expect(s.timings.shopRecallDeniedMs).toBeNull();
    expect(s.lastError).toMatch(/NOT rejected/);
  });
  it("reports honestly when recall is still accepted after the window", async () => {
    const h = await activeVisit();
    h.fetchDelegateKeys.mockResolvedValue({ account_id: ACCOUNT, keys: [] });
    const s = await h.svc.confirmRevoke("visit-1", "R", { intervalMs: 1000, denyTimeoutMs: 3000 });
    expect(s.timings.shopRecallDeniedMs).toBeNull();
    expect(s.lastError).toMatch(/recall still accepted/);
  });
  it("stays 'revoking' (not revoked) when the key is never removed from the list", async () => {
    const h = await activeVisit();
    await h.svc.startRevoke("visit-1");
    const s = await h.svc.confirmRevoke("visit-1", "R", { timeoutMs: 4000, intervalMs: 1000 });
    expect(s.session.status).toBe("revoking");
    expect(s.lastError).toMatch(/still listed/);
    expect(h.recall).not.toHaveBeenCalled();
  });
});

describe("secrecy", () => {
  it("private key never appears in any public output, across the whole lifecycle", async () => {
    const h = harness();
    const outs: unknown[] = [];
    outs.push(await h.svc.createVisit({ shopId: "s", customerAccountId: ACCOUNT }));
    h.listed.value = true;
    outs.push(await h.svc.confirmGrant("visit-1", "G"));
    outs.push(await h.svc.getState("visit-1"));
    outs.push(await h.svc.recallAsShop("visit-1", "q"));
    outs.push(await h.svc.startRevoke("visit-1"));
    h.fetchDelegateKeys.mockResolvedValue({ account_id: ACCOUNT, keys: [] });
    h.recallMode.value = "auth";
    outs.push(await h.svc.confirmRevoke("visit-1", "R", { intervalMs: 10 }));
    for (const o of outs) expect(JSON.stringify(o)).not.toMatch(/SECRETPRIVATEKEY|delegatePrivateKey|cdcdcdcd/);
    expect(h.log.mock.calls.flat().join("\n")).not.toContain("SECRETPRIVATEKEY");
  });
  it("API route responses never contain the private key (real routes, mocked relayer/MemWal)", async () => {
    vi.resetModules();
    const h = harness();
    vi.doMock("@/lib/visit", async () => ({ visitService: h.svc }));
    const [create, grant, state, recall, rstart, rconf] = await Promise.all([
      import("../../../app/api/visit/create/route"),
      import("../../../app/api/visit/grant-confirm/route"),
      import("../../../app/api/visit/state/route"),
      import("../../../app/api/visit/shop-recall/route"),
      import("../../../app/api/visit/revoke-start/route"),
      import("../../../app/api/visit/revoke-confirm/route"),
    ]);
    const post = (fn: (r: Request) => Promise<Response>, b: object) =>
      fn(new Request("http://x/api", { method: "POST", body: JSON.stringify(b) }));
    const texts: string[] = [];
    const grab = async (p: Promise<Response>) => { const r = await p; const t = await r.text(); texts.push(t); return { status: r.status, body: JSON.parse(t) }; };
    expect((await grab(post(create.POST, { shopId: "s", customerAccountId: ACCOUNT }))).status).toBe(200);
    h.listed.value = true;
    expect((await grab(post(grant.POST, { visitId: "visit-1", digest: "G" }))).body.session.status).toBe("active");
    expect((await grab(state.GET(new Request("http://x/api?visitId=visit-1")))).status).toBe(200);
    expect((await grab(post(recall.POST, { visitId: "visit-1", query: "q" }))).body.facts).toHaveLength(1);
    expect((await grab(post(rstart.POST, { visitId: "visit-1" }))).body.session.status).toBe("revoking");
    h.fetchDelegateKeys.mockResolvedValue({ account_id: ACCOUNT, keys: [] });
    h.recallMode.value = "auth";
    expect((await grab(post(rconf.POST, { visitId: "visit-1", digest: "R" }))).body.session.status).toBe("revoked");
    // error paths
    expect((await grab(post(grant.POST, { visitId: "missing", digest: "G" }))).status).toBe(404);
    expect((await grab(post(create.POST, {}))).status).toBe(400);
    for (const t of texts) expect(t).not.toMatch(/SECRETPRIVATEKEY|delegatePrivateKey|cdcdcdcd/);
    vi.doUnmock("@/lib/visit");
  });
});

describe("helpers", () => {
  it("classifies auth rejections", () => {
    expect(isAuthRejection({ status: 401 })).toBe(true);
    expect(isAuthRejection({ serverCode: "AUTH_REJECTED" })).toBe(true);
    expect(isAuthRejection({ status: 500 })).toBe(false);
    expect(isAuthRejection(new Error("x"))).toBe(false);
  });
  it("parseQrPayload rejects junk and normalizes hex", () => {
    expect(parseQrPayload("nope")).toBeNull();
    expect(parseQrPayload("{}")).toBeNull();
    expect(parseQrPayload(JSON.stringify({ shopId: "s", visitId: "v", publicKey: "zz", accountId: ACCOUNT }))).toBeNull();
    expect(parseQrPayload(JSON.stringify({ shopId: "s", visitId: "v", publicKey: PUB.toUpperCase(), accountId: ACCOUNT }))?.publicKey).toBe(PUB);
  });
});
