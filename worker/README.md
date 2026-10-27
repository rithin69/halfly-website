# Halfly licence API (Cloudflare Worker)

This small Worker sells and renews Halfly licence keys. The website itself stays fully static.

- `GET /api/health`: answers `{"ok":true}`.
- `GET /api/licence/claim?session_id=cs_...`: after a customer pays, it gives them their key.
- `POST /api/licence/refresh` with `{"key":"hfl_..."}`: Halfly calls this once a day to get a key with a new expiry date.

The key format and rules are in `docs/licensing.md` in the product repo. Until the settings below are added,
`/api/licence/*` answers `503 {"error":"licensing is not configured yet"}`. The rest of the site works as normal.

## How it fits together

- `wrangler.jsonc` has `"main": "worker/index.ts"` and `"assets": { "run_worker_first": ["/api/*"] }`.
  Cloudflare sends only `/api/...` requests to the Worker. Every other page is served straight from `out/`,
  exactly as before.
- The Worker asks Stripe whether the subscription is paid, then signs a key with the private key.
  It never stores anything and never logs keys, emails or Stripe data.

## One-time setup (about 20 minutes)

Do it all in Stripe **test mode** first, try a purchase, then repeat steps 1 to 4 in live mode.

### In Stripe (dashboard.stripe.com)

1. **Create the products.** Go to Product catalogue, then Add product:
   - "Halfly Starter": recurring price **£5.00 GBP, monthly**.
   - "Halfly Pro": recurring price **£10.00 GBP, monthly**.
2. **Copy the two price IDs.** Open each product. The price ID starts with `price_`. Keep both somewhere handy.
3. **Create a Payment Link for each price.** Go to Payment Links, then New:
   - Pick the product. To offer a free trial, tick "Include a free trial" and choose the number of days (for example 14).
   - Go to the "After payment" tab, choose "Don't show confirmation page", and redirect customers to:
     `https://halfly.co.uk/welcome?session_id={CHECKOUT_SESSION_ID}`
     Type it exactly like this. Stripe swaps `{CHECKOUT_SESSION_ID}` for the real ID.
   - Put the two links on the website's Buy buttons (pricing data in `website/src/lib/data.ts`).
   - The `/welcome` page has to call `/api/licence/claim?session_id=...` and show the customer their key.
4. **Create an API key for the Worker.** Go to Developers, then API keys, then "Create restricted key". Give it
   **Read** access to **Checkout Sessions** and **Subscriptions**, and nothing else. Copy the key (`rk_test_...` or `rk_live_...`).
   The normal secret key (`sk_...`) also works, but the restricted key is safer.

### In Cloudflare (dash.cloudflare.com)

5. Go to **Workers & Pages**, open **halfly-website**, then **Settings**, then **Variables and secrets**.
6. Click **Add** for each of these four values:

   | Name | Type | Value |
   |---|---|---|
   | `STRIPE_SECRET_KEY` | **Secret** | The Stripe key from step 4 |
   | `LICENCE_PRIVATE_KEY` | **Secret** | The text in `C:\Users\rithi\.halfly\licence_private_key_for_cloudflare.txt`. Open the file on your laptop, copy all of it, and paste it here. Never put it in git, chat or email. |
   | `PRICE_STARTER` | Text | The Starter price ID from step 2 (`price_...`) |
   | `PRICE_PRO` | Text | The Pro price ID from step 2 (`price_...`) |

7. Click **Deploy** (or push to GitHub). Settings take effect on the next deployment. `wrangler.jsonc` has
   `"keep_vars": true`, so automatic deploys keep these values.
8. **Check it.** Open `https://halfly.co.uk/api/health`. You should see `{"ok":true}`. Then buy your own plan through the
   test-mode Payment Link with card `4242 4242 4242 4242` (any future date, any CVC). The welcome page should show a
   key starting with `hfl_`. To check that key, run `halfly licence activate <key>`.
9. **Go live.** Turn off test mode in Stripe and repeat steps 1 to 4. Then replace the four values in step 6 with the live ones.

### If something goes wrong

- `503 licensing is not configured yet`: one of the four values is missing, or `LICENCE_PRIVATE_KEY` was not pasted
  completely.
- `502`: the Worker could not reach Stripe, or the Stripe key is wrong. In test mode, check that you used the
  test key. Live keys need live sessions, and test keys need test sessions.
- `402`: the payment is not finished, the subscription was cancelled or is unpaid, or the price is not one of the two
  price IDs above.
- If Workers Logs show "LICENCE_PRIVATE_KEY does not match the public key", the wrong file was pasted.
  Halfly would reject every key the Worker signs.

## For developers

```bash
npm run test:worker        # unit tests, the handler with a fake Stripe, a real workerd run, and a Python cross-check
npm run typecheck:worker   # tsc against the Workers types (the site's own `npx tsc --noEmit` excludes worker/)
npx wrangler dev --port 8787
npx wrangler deploy --dry-run
```

The tests use throwaway keypairs and make no network calls. To try the endpoints locally with settings, put TEST
values in `website/.dev.vars`. That file is gitignored. Never use the real private key there.
