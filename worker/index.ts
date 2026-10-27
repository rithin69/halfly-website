// Cloudflare Worker for halfly.co.uk. Static files (the Next.js export in out/) are served straight from assets;
// wrangler.jsonc sends only /api/* here first (`assets.run_worker_first`). Contract: docs/licensing.md.
//
//   GET  /api/health                           -> {"ok": true}
//   GET  /api/licence/claim?session_id=cs_...  -> after Stripe Checkout: {"key", "plan", "email", "exp"}
//   POST /api/licence/refresh {"key": "hfl_..."} -> {"key", "plan", "exp"} with a fresh expiry
//
// Never logs keys, emails or Stripe payloads; errors to the client are generic.

import {
  CONTRACT_PUBLIC_KEY_B64,
  MAX_KEY_LENGTH,
  customerId,
  expiryFor,
  importSigningKeys,
  isLive,
  isSubscriptionId,
  looksLikeKey,
  planForSubscription,
  signKey,
  verifyKey,
} from "./licence.ts";
import type { KeyPayload, SigningKeys, StripeSubscription } from "./licence.ts";
import { stripeGet } from "./stripe.ts";
import type { FetchLike } from "./stripe.ts";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  STRIPE_SECRET_KEY?: string;
  LICENCE_PRIVATE_KEY?: string;
  PRICE_STARTER?: string;
  PRICE_PRO?: string;
}

export interface Deps {
  fetch: FetchLike;
  /** Current time in milliseconds. */
  now: () => number;
}

interface CheckoutSession {
  status?: string;
  mode?: string;
  customer?: string | { id?: string } | null;
  customer_details?: { email?: string | null } | null;
  subscription?: string | StripeSubscription | null;
}

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;
const MAX_SESSION_ID_LENGTH = 512;
const MAX_BODY_BYTES = MAX_KEY_LENGTH + 1024;

const NOT_CONFIGURED = "licensing is not configured yet";
const UPSTREAM = "the payment provider could not be reached; please try again shortly";
const NOT_ACTIVE = "no active Halfly subscription";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

const error = (status: number, message: string, headers?: Record<string, string>) =>
  json(status, { error: message }, headers);

function isConfigured(env: Env): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.LICENCE_PRIVATE_KEY && env.PRICE_STARTER && env.PRICE_PRO);
}

// One import per isolate (and per secret value, so a rotated secret is picked up).
let keyCache: { secret: string; keys: Promise<SigningKeys> } | null = null;

async function loadKeys(env: Env): Promise<SigningKeys | null> {
  const secret = env.LICENCE_PRIVATE_KEY as string;
  if (!keyCache || keyCache.secret !== secret) {
    const keys = importSigningKeys(secret).then((k) => {
      if (k.publicKeyB64 !== CONTRACT_PUBLIC_KEY_B64) {
        // Only public information is logged here.
        console.warn("LICENCE_PRIVATE_KEY does not match the public key in docs/licensing.md; Halfly will reject these keys");
      }
      return k;
    });
    keyCache = { secret, keys };
  }
  try {
    return await keyCache.keys;
  } catch {
    keyCache = null;
    console.error("LICENCE_PRIVATE_KEY could not be loaded (expected base64 PKCS#8 DER of an Ed25519 key)");
    return null;
  }
}

/** Build and sign a key for a live subscription, or say why not. */
async function issue(
  sub: StripeSubscription,
  env: Env,
  keys: SigningKeys,
  nowMs: number,
  email: string,
  fallbackCustomer: string,
): Promise<{ key: string; payload: KeyPayload } | null> {
  if (!isLive(sub) || !isSubscriptionId(sub.id)) return null;
  const found = planForSubscription(sub, env);
  if (!found) return null;
  const nowSec = Math.floor(nowMs / 1000);
  const payload: KeyPayload = {
    v: 1,
    plan: found.plan,
    email,
    sub: sub.id,
    cus: customerId(sub.customer) || fallbackCustomer,
    iat: nowSec,
    exp: expiryFor(sub, found.item, nowSec),
  };
  return { key: await signKey(keys.privateKey, payload), payload };
}

async function claim(url: URL, env: Env, deps: Deps): Promise<Response> {
  if (!isConfigured(env)) return error(503, NOT_CONFIGURED);
  const id = url.searchParams.get("session_id") ?? "";
  if (id.length > MAX_SESSION_ID_LENGTH || !SESSION_ID.test(id)) return error(400, "invalid session_id");
  const keys = await loadKeys(env);
  if (!keys) return error(503, NOT_CONFIGURED);

  const res = await stripeGet<CheckoutSession>(
    `/v1/checkout/sessions/${id}?expand%5B%5D=subscription`,
    env.STRIPE_SECRET_KEY as string,
    deps.fetch,
  );
  if (res.kind === "not_found") return error(400, "unknown checkout session");
  if (res.kind === "error") return error(502, UPSTREAM);
  const session = res.data;
  if (session.mode !== "subscription" || session.status !== "complete") return error(402, "checkout is not complete");
  const sub = session.subscription;
  if (!sub || typeof sub !== "object") return error(402, NOT_ACTIVE);

  const rawEmail = session.customer_details?.email;
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const issued = await issue(sub, env, keys, deps.now(), email, customerId(session.customer));
  if (!issued) return error(402, NOT_ACTIVE);
  const { payload } = issued;
  return json(200, { key: issued.key, plan: payload.plan, email: payload.email, exp: payload.exp });
}

async function refresh(request: Request, env: Env, deps: Deps): Promise<Response> {
  if (!isConfigured(env)) return error(503, NOT_CONFIGURED, CORS);
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > MAX_BODY_BYTES) return error(400, "invalid licence key", CORS);
  let key: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return error(400, "invalid licence key", CORS);
    const body = JSON.parse(text) as unknown;
    key = body && typeof body === "object" ? (body as { key?: unknown }).key : undefined;
  } catch {
    return error(400, "invalid licence key", CORS);
  }
  if (typeof key === "string") key = key.trim();
  if (!looksLikeKey(key)) return error(400, "invalid licence key", CORS);

  const keys = await loadKeys(env);
  if (!keys) return error(503, NOT_CONFIGURED, CORS);
  const old = await verifyKey(keys.publicKey, key);
  if (!old) return error(400, "invalid licence key", CORS);

  // old.sub is validated against ^sub_[A-Za-z0-9]+$ by verifyKey, so it is safe in the path.
  const res = await stripeGet<StripeSubscription>(`/v1/subscriptions/${old.sub}`, env.STRIPE_SECRET_KEY as string, deps.fetch);
  if (res.kind === "not_found") return error(402, NOT_ACTIVE, CORS);
  if (res.kind === "error") return error(502, UPSTREAM, CORS);
  if (res.data.id !== old.sub) return error(402, NOT_ACTIVE, CORS);

  const issued = await issue(res.data, env, keys, deps.now(), old.email, old.cus);
  if (!issued) return error(402, NOT_ACTIVE, CORS);
  return json(200, { key: issued.key, plan: issued.payload.plan, exp: issued.payload.exp }, CORS);
}

/** Handle one /api/* request. Exported (with injectable fetch and clock) for tests. */
export async function handleApi(request: Request, env: Env, deps: Deps): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();
  try {
    switch (path) {
      case "/api/health":
        if (method !== "GET" && method !== "HEAD") return error(405, "method not allowed", { Allow: "GET, HEAD" });
        return json(200, { ok: true });
      case "/api/licence/claim":
        if (method !== "GET") return error(405, "method not allowed", { Allow: "GET" });
        return await claim(url, env, deps);
      case "/api/licence/refresh":
        if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
        if (method !== "POST") return error(405, "method not allowed", { Allow: "POST, OPTIONS", ...CORS });
        return await refresh(request, env, deps);
      default:
        return error(404, "not found");
    }
  } catch (e) {
    console.error(`licence api error: ${e instanceof Error ? e.name : "unknown"}`);
    return error(500, "internal error");
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return handleApi(request, env, { fetch: (input, init) => fetch(input, init), now: () => Date.now() });
    }
    // Only /api/* is routed here (run_worker_first); anything else is passed to the static assets unchanged.
    return env.ASSETS.fetch(request);
  },
};

export default worker;
