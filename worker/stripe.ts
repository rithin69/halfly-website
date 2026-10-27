// Minimal Stripe REST client: GET with the secret key, no SDK. Never logs request or response bodies.

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type StripeResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "not_found" }
  | { kind: "error"; status: number };

const STRIPE_API = "https://api.stripe.com";
const TIMEOUT_MS = 10_000;

/** GET a Stripe resource. `path` must already be validated (ids are checked by the caller). */
export async function stripeGet<T>(path: string, secretKey: string, fetchImpl: FetchLike): Promise<StripeResult<T>> {
  let res: Response;
  try {
    res = await fetchImpl(STRIPE_API + path, {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    console.error("stripe request failed: network error or timeout");
    return { kind: "error", status: 0 };
  }
  if (res.status === 404) {
    await res.body?.cancel();
    return { kind: "not_found" };
  }
  if (!res.ok) {
    await res.body?.cancel();
    console.error(`stripe request failed: HTTP ${res.status}`);
    return { kind: "error", status: res.status };
  }
  try {
    return { kind: "ok", data: (await res.json()) as T };
  } catch {
    console.error("stripe request failed: response was not JSON");
    return { kind: "error", status: res.status };
  }
}
