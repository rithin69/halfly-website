// Unit and handler tests for the licence Worker. No network: Stripe is a fake fetch, keys are TEST keys.
// Run: npm run test:worker   (Node 22.18+/24 runs the .ts sources directly)
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  CONTRACT_PUBLIC_KEY_B64,
  GRACE_SECONDS,
  b64Decode,
  b64urlDecode,
  b64urlEncode,
  expiryFor,
  importPublicKey,
  importSigningKeys,
  planForPrice,
  planForSubscription,
  signKey,
  verifyKey,
} from "../licence.ts";
import worker, { handleApi } from "../index.ts";
import {
  DAY,
  NOW,
  NOW_MS,
  PRICE_PRO,
  PRICE_STARTER,
  STRIPE_SECRET_KEY,
  checkoutSession,
  envWith,
  fakeStripe,
  subscription,
  testKeypair,
} from "./helpers.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PYTHON = path.join(REPO, ".venv", "Scripts", "python.exe");

let kp; // TEST keypair
let otherKp; // a second TEST keypair (keys signed by it must be rejected)
const logged = [];
const originals = {};

before(async () => {
  kp = await testKeypair();
  otherKp = await testKeypair();
  // Capture console output so we can check nothing secret is ever logged.
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    originals[level] = console[level];
    console[level] = (...args) => logged.push(args.map(String).join(" "));
  }
});

after(() => {
  for (const [level, fn] of Object.entries(originals)) console[level] = fn;
});

const payload = (over = {}) => ({
  v: 1, plan: "starter", email: "buyer@example.com", sub: "sub_1TestSub", cus: "cus_TestCustomer",
  iat: NOW, exp: NOW + 37 * DAY, ...over,
});

const req = (p, init) => new Request("https://halfly.co.uk" + p, init);
const call = (p, env, stripe, init) => handleApi(req(p, init), env, { fetch: stripe.fetch, now: () => NOW_MS });
const refreshReq = (key) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });

describe("base64url", () => {
  test("round-trips every length without padding", () => {
    for (let n = 0; n < 70; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 255);
      const s = b64urlEncode(bytes);
      assert.ok(!/[=+/]/.test(s), s);
      assert.deepEqual(b64urlDecode(s), bytes);
      assert.equal(s, Buffer.from(bytes).toString("base64url"));
    }
  });
  test("rejects padding and the standard alphabet", () => {
    assert.throws(() => b64urlDecode("YQ=="));
    assert.throws(() => b64urlDecode("a+b/"));
    assert.throws(() => b64urlDecode("abcde"));
  });
  test("contract public key is 32 raw bytes and imports", async () => {
    assert.equal(b64Decode(CONTRACT_PUBLIC_KEY_B64).length, 32);
    await importPublicKey(CONTRACT_PUBLIC_KEY_B64);
  });
});

describe("sign and verify", () => {
  test("public key derived from the PKCS#8 private key matches the real one", async () => {
    const keys = await importSigningKeys(kp.privateKeyB64);
    assert.equal(keys.publicKeyB64, kp.publicKeyB64);
  });

  test("a signed key has the contract format and verifies", async () => {
    const keys = await importSigningKeys(kp.privateKeyB64);
    const key = await signKey(keys.privateKey, payload());
    assert.match(key, /^hfl_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const [p, s] = key.slice(4).split(".");
    assert.equal(Buffer.from(s, "base64url").length, 64);
    assert.deepEqual(JSON.parse(Buffer.from(p, "base64url").toString("utf8")), payload());
    // Verified with an independently imported public key (as Halfly does).
    assert.deepEqual(await verifyKey(kp.publicKey, key), payload());
    assert.deepEqual(await verifyKey(await importPublicKey(kp.publicKeyB64), key), payload());
  });

  test("tampered, foreign or malformed keys are rejected", async () => {
    const keys = await importSigningKeys(kp.privateKeyB64);
    const key = await signKey(keys.privateKey, payload());
    const [p, s] = key.slice(4).split(".");
    const forged = "hfl_" + b64urlEncode(new TextEncoder().encode(JSON.stringify(payload({ plan: "pro" })))) + "." + s;
    const flipped = "hfl_" + p + "." + (s[0] === "A" ? "B" : "A") + s.slice(1);
    const foreign = await signKey((await importSigningKeys(otherKp.privateKeyB64)).privateKey, payload());
    for (const bad of [forged, flipped, foreign, key + "=", key.replace("hfl_", "hfx_"), key + ".x", "hfl_" + p,
      "hfl_" + "A".repeat(5000) + "." + s, "", null, 42, { key }]) {
      assert.equal(await verifyKey(kp.publicKey, bad), null, String(bad).slice(0, 40));
    }
  });

  test("validly signed but wrong-shaped payloads are rejected", async () => {
    const keys = await importSigningKeys(kp.privateKeyB64);
    for (const over of [{ v: 2 }, { plan: "free" }, { sub: "sub_x/../../v1/charges" }, { exp: "soon" }, { email: null }]) {
      const key = await signKey(keys.privateKey, payload(over));
      assert.equal(await verifyKey(kp.publicKey, key), null, JSON.stringify(over));
    }
  });
});

describe("plans and expiry", () => {
  const prices = { PRICE_STARTER, PRICE_PRO };
  test("plan from price id", () => {
    assert.equal(planForPrice(PRICE_STARTER, prices), "starter");
    assert.equal(planForPrice(PRICE_PRO, prices), "pro");
    assert.equal(planForPrice("price_other", prices), null);
    assert.equal(planForPrice(undefined, prices), null);
    assert.equal(planForPrice("", { PRICE_STARTER: "", PRICE_PRO: "" }), null);
    const sub = subscription({ items: { data: [{ price: { id: "price_other" } }, { price: { id: PRICE_PRO } }] } });
    assert.equal(planForSubscription(sub, prices).plan, "pro");
    assert.equal(planForSubscription(subscription({ items: { data: [] } }), prices), null);
  });

  test("current_period_end on the item (Stripe 2025-03-31.basil and later)", () => {
    const sub = subscription();
    assert.equal(expiryFor(sub, sub.items.data[0], NOW), NOW + 30 * DAY + GRACE_SECONDS);
  });
  test("current_period_end on the subscription (older API versions)", () => {
    const sub = subscription({ current_period_end: NOW + 10 * DAY, items: { data: [{ price: { id: PRICE_STARTER } }] } });
    assert.equal(expiryFor(sub, sub.items.data[0], NOW), NOW + 10 * DAY + GRACE_SECONDS);
  });
  test("trial_end while trialing", () => {
    const sub = subscription({ status: "trialing", trial_end: NOW + 14 * DAY });
    assert.equal(expiryFor(sub, sub.items.data[0], NOW), NOW + 14 * DAY + GRACE_SECONDS);
  });
  test("no date or a past date never gives less than now + grace", () => {
    assert.equal(expiryFor(subscription({ items: { data: [{}] } }), null, NOW), NOW + GRACE_SECONDS);
    assert.equal(expiryFor(subscription({ current_period_end: NOW - DAY }), null, NOW), NOW + GRACE_SECONDS);
  });
});

describe("routing", () => {
  test("health", async () => {
    const res = await call("/api/health", {}, fakeStripe({}));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(res.headers.get("Cache-Control"), "no-store");
  });
  test("unknown api path is a JSON 404; non-api paths go to the static assets", async () => {
    assert.equal((await call("/api/nope", {}, fakeStripe({}))).status, 404);
    const res = await worker.fetch(req("/pricing"), envWith(kp.privateKeyB64));
    assert.equal(await res.text(), "<html>site</html>");
  });
  test("wrong methods", async () => {
    const env = envWith(kp.privateKeyB64);
    assert.equal((await call("/api/licence/claim?session_id=cs_test_a", env, fakeStripe({}), { method: "POST" })).status, 405);
    const r = await call("/api/licence/refresh", env, fakeStripe({}));
    assert.equal(r.status, 405);
    assert.equal(r.headers.get("Access-Control-Allow-Origin"), "*");
  });
  test("refresh answers CORS preflight", async () => {
    const r = await call("/api/licence/refresh", envWith(kp.privateKeyB64), fakeStripe({}), { method: "OPTIONS" });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get("Access-Control-Allow-Origin"), "*");
    assert.match(r.headers.get("Access-Control-Allow-Methods"), /POST/);
  });
  test("503 when any setting is missing", async () => {
    for (const missing of ["STRIPE_SECRET_KEY", "LICENCE_PRIVATE_KEY", "PRICE_STARTER", "PRICE_PRO"]) {
      const env = envWith(kp.privateKeyB64, { [missing]: undefined });
      const stripe = fakeStripe({});
      const c = await call("/api/licence/claim?session_id=cs_test_a", env, stripe);
      assert.equal(c.status, 503);
      assert.deepEqual(await c.json(), { error: "licensing is not configured yet" });
      const r = await call("/api/licence/refresh", env, stripe, refreshReq("hfl_a.b"));
      assert.equal(r.status, 503);
      assert.equal(stripe.calls.length, 0);
    }
    const noSecrets = await call("/api/licence/claim", { ASSETS: null }, fakeStripe({}));
    assert.equal(noSecrets.status, 503);
  });
  test("503 (not 500) when the private key secret is garbage", async () => {
    const r = await call("/api/licence/claim?session_id=cs_test_a", envWith("bm90IGEga2V5"), fakeStripe({}));
    assert.equal(r.status, 503);
  });
});

describe("claim", () => {
  const path = (id = "cs_test_abc123") => `/api/licence/claim?session_id=${encodeURIComponent(id)}`;
  const route = (body, status = 200) => ({ "/v1/checkout/sessions/cs_test_abc123": { status, body } });

  test("issues a starter key for a complete subscription checkout", async () => {
    const stripe = fakeStripe(route(checkoutSession()));
    const res = await call(path(), envWith(kp.privateKeyB64), stripe);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(Object.keys(body).sort(), ["email", "exp", "key", "plan"]);
    assert.equal(body.plan, "starter");
    assert.equal(body.email, "buyer@example.com");
    assert.equal(body.exp, NOW + 30 * DAY + GRACE_SECONDS);
    assert.deepEqual(await verifyKey(kp.publicKey, body.key), {
      v: 1, plan: "starter", email: "buyer@example.com", sub: "sub_1TestSub", cus: "cus_TestCustomer", iat: NOW, exp: body.exp,
    });
    // The Stripe call: right URL, expand, secret key as a Bearer token.
    assert.equal(stripe.calls.length, 1);
    const { url, headers } = stripe.calls[0];
    assert.equal(url.pathname, "/v1/checkout/sessions/cs_test_abc123");
    assert.deepEqual(url.searchParams.getAll("expand[]"), ["subscription"]);
    assert.equal(headers.get("Authorization"), `Bearer ${STRIPE_SECRET_KEY}`);
  });

  test("pro plan, trialing, live-mode id, no email", async () => {
    const sub = subscription({ status: "trialing", trial_end: NOW + 14 * DAY,
      items: { data: [{ price: { id: PRICE_PRO }, current_period_end: NOW + 14 * DAY }] } });
    const stripe = fakeStripe({ "/v1/checkout/sessions/cs_live_Z9": { body: checkoutSession({ subscription: sub, customer_details: { email: null } }) } });
    const res = await call(path("cs_live_Z9"), envWith(kp.privateKeyB64), stripe);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.plan, "pro");
    assert.equal(body.email, "");
    assert.equal(body.exp, NOW + 14 * DAY + GRACE_SECONDS);
  });

  test("bad or missing session ids are 400 without calling Stripe", async () => {
    const stripe = fakeStripe({});
    for (const id of ["", "cs_abc", "cs_test_", "cs_test_a/../../v1/customers", "cs_test_a b", "pi_test_abc", "cs_test_" + "a".repeat(600)]) {
      const res = await call(path(id), envWith(kp.privateKeyB64), stripe);
      assert.equal(res.status, 400, id);
    }
    assert.equal((await call("/api/licence/claim", envWith(kp.privateKeyB64), stripe)).status, 400);
    assert.equal(stripe.calls.length, 0);
  });

  test("402 unless the checkout is complete with a live subscription on a Halfly price", async () => {
    const cases = [
      checkoutSession({ status: "open" }),
      checkoutSession({ status: "expired" }),
      checkoutSession({ mode: "payment", subscription: null }),
      checkoutSession({ subscription: "sub_1TestSub" }), // not expanded
      checkoutSession({ subscription: subscription({ status: "incomplete" }) }),
      checkoutSession({ subscription: subscription({ status: "canceled" }) }),
      checkoutSession({ subscription: subscription({ status: "past_due" }) }),
      checkoutSession({ subscription: subscription({ items: { data: [{ price: { id: "price_someone_else" } }] } }) }),
    ];
    for (const s of cases) {
      const res = await call(path(), envWith(kp.privateKeyB64), fakeStripe(route(s)));
      assert.equal(res.status, 402, JSON.stringify(s).slice(0, 120));
      assert.equal(typeof (await res.json()).error, "string");
    }
  });

  test("unknown session is 400; Stripe trouble is 502", async () => {
    assert.equal((await call(path("cs_test_unknown"), envWith(kp.privateKeyB64), fakeStripe({}))).status, 400);
    assert.equal((await call(path(), envWith(kp.privateKeyB64), fakeStripe(route({}, 500)))).status, 502);
    assert.equal((await call(path(), envWith(kp.privateKeyB64), fakeStripe(route({}, 401)))).status, 502);
    assert.equal((await call(path(), envWith(kp.privateKeyB64),
      fakeStripe({ "/v1/checkout/sessions/cs_test_abc123": new TypeError("network down") }))).status, 502);
  });
});

describe("refresh", () => {
  const signed = async (over) => signKey((await importSigningKeys(kp.privateKeyB64)).privateKey, payload(over));
  const subRoute = (body, status = 200) => ({ "/v1/subscriptions/sub_1TestSub": { status, body } });

  test("re-issues an expired key with a fresh expiry and the current plan", async () => {
    const old = await signed({ exp: NOW - DAY, iat: NOW - 40 * DAY });
    const sub = subscription({ items: { data: [{ price: { id: PRICE_PRO }, current_period_end: NOW + 20 * DAY }] } });
    const stripe = fakeStripe(subRoute(sub));
    const res = await call("/api/licence/refresh", envWith(kp.privateKeyB64), stripe, refreshReq(old));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    const body = await res.json();
    assert.deepEqual(Object.keys(body).sort(), ["exp", "key", "plan"]);
    assert.equal(body.plan, "pro");
    assert.equal(body.exp, NOW + 20 * DAY + GRACE_SECONDS);
    const p = await verifyKey(kp.publicKey, body.key);
    assert.deepEqual(p, { ...payload(), plan: "pro", iat: NOW, exp: body.exp });
    assert.equal(stripe.calls[0].url.pathname, "/v1/subscriptions/sub_1TestSub");
    assert.equal(stripe.calls[0].headers.get("Authorization"), `Bearer ${STRIPE_SECRET_KEY}`);
  });

  test("accepts surrounding whitespace in the key", async () => {
    const res = await call("/api/licence/refresh", envWith(kp.privateKeyB64), fakeStripe(subRoute(subscription())),
      refreshReq("  " + (await signed()) + "\n"));
    assert.equal(res.status, 200);
  });

  test("402 when the subscription is no longer live or no longer exists", async () => {
    const key = await signed();
    for (const status of ["canceled", "past_due", "unpaid", "incomplete_expired", "paused"]) {
      const res = await call("/api/licence/refresh", envWith(kp.privateKeyB64), fakeStripe(subRoute(subscription({ status }))), refreshReq(key));
      assert.equal(res.status, 402, status);
      assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    }
    assert.equal((await call("/api/licence/refresh", envWith(kp.privateKeyB64), fakeStripe({}), refreshReq(key))).status, 402);
    const otherPrice = subscription({ items: { data: [{ price: { id: "price_other" } }] } });
    assert.equal((await call("/api/licence/refresh", envWith(kp.privateKeyB64), fakeStripe(subRoute(otherPrice)), refreshReq(key))).status, 402);
  });

  test("400 for invalid keys and bodies, without calling Stripe", async () => {
    const stripe = fakeStripe(subRoute(subscription()));
    const foreign = await signKey((await importSigningKeys(otherKp.privateKeyB64)).privateKey, payload());
    const bodies = [
      JSON.stringify({ key: foreign }),
      JSON.stringify({ key: "hfl_abc.def" }),
      JSON.stringify({ key: "sk_live_123" }),
      JSON.stringify({ key: "hfl_" + "a".repeat(5000) + ".b" }),
      JSON.stringify({ key: 7 }),
      JSON.stringify({}),
      JSON.stringify("hfl_a.b"),
      "not json",
      "",
      JSON.stringify({ key: "x".repeat(20000) }),
    ];
    for (const body of bodies) {
      const res = await call("/api/licence/refresh", envWith(kp.privateKeyB64), stripe, { method: "POST", body });
      assert.equal(res.status, 400, body.slice(0, 60));
      assert.deepEqual(await res.json(), { error: "invalid licence key" });
    }
    assert.equal(stripe.calls.length, 0);
  });

  test("502 when Stripe is down (Halfly keeps its current key)", async () => {
    const res = await call("/api/licence/refresh", envWith(kp.privateKeyB64), fakeStripe(subRoute({}, 503)), refreshReq(await signed()));
    assert.equal(res.status, 502);
  });
});

test("nothing secret is ever logged", () => {
  const all = logged.join("\n");
  for (const secret of [STRIPE_SECRET_KEY, kp.privateKeyB64, "buyer@example.com", "hfl_", "cus_TestCustomer", "cs_test_abc123"]) {
    assert.ok(!all.includes(secret), `log contains ${secret.slice(0, 12)}...`);
  }
});

// Cross-check with the Python product: a key signed here (with a TEST private key) must verify with
// `cryptography` exactly as docs/licensing.md says, and with halfly.licence.verify itself.
test("a Worker-signed key verifies in Python", { skip: !existsSync(PYTHON) && "no .venv python" }, async () => {
  const keys = await importSigningKeys(kp.privateKeyB64);
  const p = payload({ email: "zoë@example.com", exp: Math.floor(Date.now() / 1000) + 30 * DAY });
  const key = await signKey(keys.privateKey, p);
  const script = `
import base64, json, sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
key, pub = sys.argv[1], sys.argv[2]
assert key.startswith("hfl_") and key.count(".") == 1
payload_b64, sig_b64 = key[4:].split(".")
dec = lambda s: base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))
payload, sig = dec(payload_b64), dec(sig_b64)
assert len(sig) == 64
Ed25519PublicKey.from_public_bytes(base64.b64decode(pub)).verify(sig, payload)  # raises if invalid
data = json.loads(payload.decode("utf-8"))
out = {"cryptography": True, "payload": data}
try:
    sys.path.insert(0, "src")
    from halfly import licence
    lic = licence.verify(key, public_key_b64=pub)
    out["halfly"] = {"valid": lic.valid, "plan": lic.plan, "email": lic.email, "sub": lic.sub, "exp": lic.exp, "reason": lic.reason}
except ImportError as e:
    out["halfly"] = None
print(json.dumps(out))
`;
  const r = spawnSync(PYTHON, ["-c", script, key, kp.publicKeyB64], { cwd: REPO, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout.trim().split("\n").pop());
  assert.equal(out.cryptography, true);
  assert.deepEqual(out.payload, p);
  if (existsSync(path.join(REPO, "src", "halfly", "licence.py"))) assert.ok(out.halfly, "halfly.licence did not import");
  if (out.halfly) {
    assert.deepEqual(out.halfly, { valid: true, plan: "starter", email: p.email, sub: p.sub, exp: p.exp, reason: "ok" });
  }
  // And Python must reject the same key under the real (contract) public key, since it was signed with a test key.
  const r2 = spawnSync(PYTHON, ["-c", script, key, CONTRACT_PUBLIC_KEY_B64], { cwd: REPO, encoding: "utf8" });
  assert.notEqual(r2.status, 0);
  assert.match(r2.stderr, /InvalidSignature/);
});
