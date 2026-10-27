// The same Worker, bundled the way Wrangler does (esbuild) and run in the real Workers runtime (workerd, via
// Miniflare), to prove Ed25519 PKCS#8 import, JWK export, signing and verifying work there, not just in Node.
// Outbound fetches (Stripe) are answered by a local fake: no network, TEST keys only.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { Miniflare } from "miniflare";

import { importPublicKey, verifyKey, GRACE_SECONDS } from "../licence.ts";
import { DAY, PRICE_PRO, PRICE_STARTER, STRIPE_SECRET_KEY, checkoutSession, subscription, testKeypair } from "./helpers.mjs";

const ENTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../index.ts");
let mf;
let kp;
const stripeCalls = [];

before(async () => {
  kp = await testKeypair();
  const bundle = await build({ entryPoints: [ENTRY], bundle: true, format: "esm", platform: "neutral", write: false, target: "es2022" });
  const now = Math.floor(Date.now() / 1000);
  const sub = subscription({ items: { data: [{ price: { id: PRICE_PRO }, current_period_end: now + 30 * DAY }] } });
  const text = (value) => ({ type: "text", value });
  // Miniflare 5 option shape (workers[].config / workers[].dev).
  mf = new Miniflare({
    workers: [{
      config: {
        name: "halfly-website-test",
        compatibilityDate: "2026-10-23",
        manifest: { mainModule: "index.js", modules: { "index.js": { type: "esm", contents: bundle.outputFiles[0].text } } },
        env: {
          STRIPE_SECRET_KEY: text(STRIPE_SECRET_KEY),
          LICENCE_PRIVATE_KEY: text(kp.privateKeyB64),
          PRICE_STARTER: text(PRICE_STARTER),
          PRICE_PRO: text(PRICE_PRO),
          ASSETS: { type: "fetcher", handler: () => new Response("<html>site</html>", { headers: { "Content-Type": "text/html" } }) },
        },
      },
      dev: {
        outboundService: {
          type: "fetcher",
          handler: (request) => {
            const url = new URL(request.url);
            stripeCalls.push({ url: url.href, auth: request.headers.get("Authorization") });
            if (url.pathname === "/v1/checkout/sessions/cs_test_workerd1") {
              return Response.json(checkoutSession({ subscription: sub }));
            }
            if (url.pathname === "/v1/subscriptions/sub_1TestSub") return Response.json(sub);
            return new Response("{}", { status: 404 });
          },
        },
      },
    }],
  });
  await mf.ready;
});

after(async () => {
  await mf?.dispose();
});

test("workerd: claim signs a key that verifies, refresh re-issues it", async () => {
  const pub = await importPublicKey(kp.publicKeyB64);
  const res = await mf.dispatchFetch("https://halfly.co.uk/api/licence/claim?session_id=cs_test_workerd1");
  assert.equal(res.status, 200, await res.clone().text());
  const body = await res.json();
  assert.equal(body.plan, "pro");
  const p = await verifyKey(pub, body.key);
  assert.ok(p, "key signed in workerd must verify in Node");
  assert.equal(p.exp, body.exp);
  assert.ok(body.exp > Math.floor(Date.now() / 1000) + 30 * DAY + GRACE_SECONDS - 120);
  assert.equal(stripeCalls[0].auth, `Bearer ${STRIPE_SECRET_KEY}`);

  // Refresh: verification of the old key happens inside workerd with the derived public key.
  const r = await mf.dispatchFetch("https://halfly.co.uk/api/licence/refresh", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: body.key }),
  });
  assert.equal(r.status, 200, await r.clone().text());
  const fresh = await r.json();
  assert.ok(await verifyKey(pub, fresh.key));

  // A tampered key is refused in workerd.
  const tampered = body.key.slice(0, -2) + (body.key.endsWith("AA") ? "BA" : "AA");
  const bad = await mf.dispatchFetch("https://halfly.co.uk/api/licence/refresh", { method: "POST", body: JSON.stringify({ key: tampered }) });
  assert.equal(bad.status, 400);
});

test("workerd: health and asset fallthrough", async () => {
  const h = await mf.dispatchFetch("https://halfly.co.uk/api/health");
  assert.deepEqual(await h.json(), { ok: true });
  const page = await mf.dispatchFetch("https://halfly.co.uk/");
  assert.equal(await page.text(), "<html>site</html>");
});
