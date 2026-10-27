// Licence keys: `hfl_<payload>.<signature>`, exactly as docs/licensing.md says.
// payload = base64url (no padding) of UTF-8 JSON; signature = base64url (no padding) of the 64-byte Ed25519
// signature over the exact decoded payload bytes. Pure functions only (no Stripe, no env), so they are easy to test.

/** The public key Halfly (the Python product) verifies keys with. Raw 32 bytes, standard base64. */
export const CONTRACT_PUBLIC_KEY_B64 = "aocVrYVle+Hep8eDZDUpo+rLg5+jTzOacTOYYij7guw=";
export const KEY_PREFIX = "hfl_";
/** Keys must be shorter than this (Halfly refuses anything longer). */
export const MAX_KEY_LENGTH = 4096;
/** Grace period added to the paid-until date, so a late renewal never switches a customer off. */
export const GRACE_SECONDS = 7 * 24 * 60 * 60;

export type Plan = "starter" | "pro";

export interface KeyPayload {
  v: 1;
  plan: Plan;
  email: string;
  sub: string;
  cus: string;
  iat: number;
  exp: number;
}

export interface SigningKeys {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  /** Raw public key, standard base64 (compare with CONTRACT_PUBLIC_KEY_B64). */
  publicKeyB64: string;
}

const ED25519 = { name: "Ed25519" };
const SUB_ID = /^sub_[A-Za-z0-9]+$/;

// ---------- base64 ----------

export function b64Encode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64Decode(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** base64url without padding. */
export function b64urlEncode(bytes: Uint8Array): string {
  return b64Encode(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Strict base64url decode (no padding, url-safe alphabet only). Throws on bad input. */
export function b64urlDecode(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) throw new Error("bad base64url");
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return b64Decode(b64);
}

// ---------- keys ----------

/**
 * Import the signing key from base64 PKCS#8 DER (the LICENCE_PRIVATE_KEY secret) and derive its public key
 * (via the private JWK's `x`), so the Worker verifies with exactly the key it signs with.
 */
export async function importSigningKeys(privateKeyB64: string): Promise<SigningKeys> {
  const der = b64Decode(privateKeyB64.trim());
  const privateKey = await crypto.subtle.importKey("pkcs8", der, ED25519, true, ["sign"]);
  const jwk = (await crypto.subtle.exportKey("jwk", privateKey)) as JsonWebKey;
  if (!jwk.x) throw new Error("private key has no public part");
  const raw = b64urlDecode(jwk.x);
  if (raw.length !== 32) throw new Error("unexpected public key length");
  const publicKey = await crypto.subtle.importKey("raw", raw, ED25519, true, ["verify"]);
  return { privateKey, publicKey, publicKeyB64: b64Encode(raw) };
}

/** Import a raw 32-byte Ed25519 public key given as standard base64. */
export async function importPublicKey(publicKeyB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", b64Decode(publicKeyB64), ED25519, false, ["verify"]);
}

export async function signKey(privateKey: CryptoKey, payload: KeyPayload): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign(ED25519, privateKey, bytes));
  return `${KEY_PREFIX}${b64urlEncode(bytes)}.${b64urlEncode(sig)}`;
}

/** Cheap shape check before any crypto: `hfl_` prefix, under 4 KB, one dot. */
export function looksLikeKey(key: unknown): key is string {
  return (
    typeof key === "string" &&
    key.startsWith(KEY_PREFIX) &&
    key.length < MAX_KEY_LENGTH &&
    key.indexOf(".") === key.lastIndexOf(".") &&
    key.includes(".")
  );
}

/** Verify a key's signature and fields. Returns the payload, or null for anything invalid. Never throws. */
export async function verifyKey(publicKey: CryptoKey, key: unknown): Promise<KeyPayload | null> {
  if (!looksLikeKey(key)) return null;
  const [payloadPart, sigPart] = key.slice(KEY_PREFIX.length).split(".");
  if (!payloadPart || !sigPart) return null;
  let payloadBytes: Uint8Array;
  let sig: Uint8Array;
  try {
    payloadBytes = b64urlDecode(payloadPart);
    sig = b64urlDecode(sigPart);
  } catch {
    return null;
  }
  if (sig.length !== 64) return null;
  let ok = false;
  try {
    ok = await crypto.subtle.verify(ED25519, publicKey, sig, payloadBytes);
  } catch {
    return null;
  }
  if (!ok) return null;
  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(payloadBytes));
  } catch {
    return null;
  }
  return isPayload(data) ? data : null;
}

function isPayload(d: unknown): d is KeyPayload {
  if (typeof d !== "object" || d === null) return false;
  const p = d as Record<string, unknown>;
  return (
    p.v === 1 &&
    (p.plan === "starter" || p.plan === "pro") &&
    typeof p.email === "string" &&
    typeof p.sub === "string" &&
    SUB_ID.test(p.sub) &&
    typeof p.cus === "string" &&
    Number.isInteger(p.iat) &&
    Number.isInteger(p.exp)
  );
}

export function isSubscriptionId(s: unknown): s is string {
  return typeof s === "string" && s.length <= 255 && SUB_ID.test(s);
}

// ---------- plans and expiry (from Stripe subscription objects) ----------

export interface PriceIds {
  PRICE_STARTER?: string;
  PRICE_PRO?: string;
}

export interface StripeSubscriptionItem {
  price?: { id?: string } | null;
  current_period_end?: number | null;
}

export interface StripeSubscription {
  id?: string;
  status?: string;
  customer?: string | { id?: string } | null;
  current_period_end?: number | null;
  trial_end?: number | null;
  items?: { data?: StripeSubscriptionItem[] } | null;
}

export function planForPrice(priceId: string | undefined | null, prices: PriceIds): Plan | null {
  if (!priceId) return null;
  if (prices.PRICE_PRO && priceId === prices.PRICE_PRO) return "pro";
  if (prices.PRICE_STARTER && priceId === prices.PRICE_STARTER) return "starter";
  return null;
}

/** The subscription's Halfly plan (Pro wins if somehow both prices are on it) and the item that carries it. */
export function planForSubscription(
  sub: StripeSubscription,
  prices: PriceIds,
): { plan: Plan; item: StripeSubscriptionItem } | null {
  let found: { plan: Plan; item: StripeSubscriptionItem } | null = null;
  for (const item of sub.items?.data ?? []) {
    const plan = planForPrice(item?.price?.id, prices);
    if (plan === "pro") return { plan, item };
    if (plan && !found) found = { plan, item };
  }
  return found;
}

export function isLive(sub: StripeSubscription): boolean {
  return sub.status === "active" || sub.status === "trialing";
}

const isTime = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * Key expiry in unix seconds: the paid-until date plus 7 days grace.
 * Paid-until = `trial_end` while trialing, else `current_period_end`. Stripe API versions from 2025-03-31.basil
 * moved `current_period_end` from the subscription onto each subscription item, so both places are checked.
 * Never earlier than now + grace (if Stripe gives no date, the daily refresh keeps extending the key).
 */
export function expiryFor(sub: StripeSubscription, item: StripeSubscriptionItem | null, nowSec: number): number {
  let paidUntil: number | null = null;
  if (sub.status === "trialing" && isTime(sub.trial_end)) paidUntil = sub.trial_end;
  else if (isTime(sub.current_period_end)) paidUntil = sub.current_period_end;
  else if (item && isTime(item.current_period_end)) paidUntil = item.current_period_end;
  else {
    for (const it of sub.items?.data ?? []) {
      if (isTime(it?.current_period_end)) paidUntil = Math.max(paidUntil ?? 0, it.current_period_end);
    }
  }
  return Math.floor(Math.max(paidUntil ?? 0, nowSec)) + GRACE_SECONDS;
}

export function customerId(c: StripeSubscription["customer"]): string {
  if (typeof c === "string") return c;
  if (c && typeof c.id === "string") return c.id;
  return "";
}
