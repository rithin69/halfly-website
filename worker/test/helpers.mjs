// Shared test helpers: a throwaway Ed25519 keypair (never the real one) and fake Stripe objects.
import { b64Encode } from "../licence.ts";

export const PRICE_STARTER = "price_test_starter";
export const PRICE_PRO = "price_test_pro";
export const STRIPE_SECRET_KEY = "sk_test_fake_for_unit_tests";
export const NOW_MS = Date.UTC(2026, 9, 27, 12, 0, 0); // 27 Oct 2026
export const NOW = Math.floor(NOW_MS / 1000);
export const DAY = 24 * 60 * 60;

/** A fresh TEST keypair: base64 PKCS#8 DER private key (the LICENCE_PRIVATE_KEY format) and raw public key. */
export async function testKeypair() {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  return { privateKeyB64: b64Encode(pkcs8), publicKeyB64: b64Encode(raw), publicKey: pair.publicKey };
}

export function subscription(over = {}) {
  return {
    id: "sub_1TestSub",
    object: "subscription",
    status: "active",
    customer: "cus_TestCustomer",
    trial_end: null,
    items: {
      object: "list",
      data: [{ id: "si_1", price: { id: PRICE_STARTER }, current_period_end: NOW + 30 * DAY }],
    },
    ...over,
  };
}

export function checkoutSession(over = {}) {
  return {
    id: "cs_test_abc123",
    object: "checkout.session",
    mode: "subscription",
    status: "complete",
    payment_status: "paid",
    customer: "cus_TestCustomer",
    customer_details: { email: "buyer@example.com" },
    subscription: subscription(),
    ...over,
  };
}

/** A fake fetch that answers from `routes` (pathname -> {status, body} or a function) and records every call. */
export function fakeStripe(routes) {
  const calls = [];
  const fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    calls.push({ url, headers: new Headers(init.headers ?? {}) });
    if (url.origin !== "https://api.stripe.com") throw new Error("unexpected host " + url.origin);
    const route = routes[url.pathname];
    if (route instanceof Error) throw route;
    const r = typeof route === "function" ? route(url) : route;
    if (!r) return new Response(JSON.stringify({ error: { type: "invalid_request_error" } }), { status: 404 });
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status ?? 200, headers: { "Content-Type": "application/json" } });
  };
  return { fetch, calls };
}

export function envWith(privateKeyB64, over = {}) {
  return {
    ASSETS: { fetch: async () => new Response("<html>site</html>", { headers: { "Content-Type": "text/html" } }) },
    STRIPE_SECRET_KEY,
    LICENCE_PRIVATE_KEY: privateKeyB64,
    PRICE_STARTER,
    PRICE_PRO,
    ...over,
  };
}
