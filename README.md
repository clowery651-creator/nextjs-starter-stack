# nextjs-starter-stack

Production storefront for **Twisted Reality E.N.T.**: Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS v4, with commerce from Shopify's Storefront API through **Hydrogen React** (`@shopify/hydrogen-react`). Checkout stays on Shopify. Deploys to Vercel.

## Features

| Area | What's included |
| --- | --- |
| Catalog | `/products` (all products, sort + cursor pagination), `/products/[handle]` (gallery, variant options, add to cart, recommendations) |
| Collections | `/collections` index and `/collections/[handle]` with sort (`featured`, `best-selling`, `newest`, price, A–Z) and pagination (`?after=` / `?before=` cursors) |
| Search | `/search?q=` (Storefront `search`, products only, sortable, paginated) and a header search box with predictive suggestions from `/api/search/suggest` (Storefront `predictiveSearch`) |
| Navigation | Header menu from the Shopify menu `main-menu` (falls back to collections), mobile nav drawer, footer with policy links, Pinterest link and the customer-accounts link |
| Cart | Slide-over cart drawer with optimistic updates (`useOptimistic`), plus the full `/cart` page. Checkout button links to Shopify's hosted checkout |
| Branding | Dark streetwear theme with violet glitch accents; Tailwind v4 design tokens in `src/app/globals.css`; brand mark favicon, apple icon and default Open Graph image |
| SEO | `generateMetadata` for products, collections, search, policies and pages; canonical URLs; OG/Twitter images from product/collection images; `sitemap.xml`; `robots.txt` (blocks indexing on Vercel preview deploys); Product, Breadcrumb and Organization JSON-LD |
| Analytics | Vercel Web Analytics + Speed Insights; Shopify analytics (`page_view`, `add_to_cart`) only after the visitor accepts the consent banner |
| Resilience | `error.tsx`, `global-error.tsx`, `not-found.tsx` (missing products/collections/policies/pages return a real 404), `loading.tsx` skeletons |
| Performance | Partial prerendering, `"use cache"` data with cache tags, `next/image` for `cdn.shopify.com` (AVIF/WebP), on-demand revalidation webhook, security headers |
| Accounts | In-app sign-in with the Shopify **Customer Account API** (OAuth 2.0 + PKCE, public client): profile, recent orders, paginated order history and order detail pages, header account menu (desktop + mobile), cart linked to the signed-in customer. Without a client ID it falls back to a native-looking hand-off to `account.twistedrealityentertainment.com` |
| CI | GitHub Actions: `npm ci`, lint, typecheck, build on every push to `main` and every PR |

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/` dir, Cache Components + partial prefetching) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme` tokens) |
| Commerce | Shopify Storefront API **2026-04** via `@shopify/hydrogen-react` 2026.4.x |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights`, Hydrogen React `sendShopifyAnalytics` |
| Hosting | Vercel (preview deploys on PRs, production on `main`) |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Shopify values
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate route types (`next typegen`) and run `tsc --noEmit` |

## Environment variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `SHOPIFY_STORE_DOMAIN` | Yes | `twistedrealityent.myshopify.com` | The custom domain `shop.twistedrealityentertainment.com` also works |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Yes | *(public Storefront token)* | Shopify admin → Sales channels → **Headless** → storefront → Storefront API → **Public access token** |
| `SHOPIFY_STOREFRONT_API_VERSION` | No | `2026-04` | Defaults to `2026-04`, the version Hydrogen React 2026.4.x is built for |
| `NEXT_PUBLIC_SITE_URL` | Recommended | `https://www.example.com` | Canonical origin for metadata, OG tags, sitemap and robots. Falls back to `VERCEL_PROJECT_PRODUCTION_URL` (set automatically by Vercel), then `VERCEL_URL`, then `http://localhost:3000` |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | For in-app accounts | `039bc1b2-…` | Headless → storefront → **Customer Account API** → Credentials. Public value. Unset = hosted accounts fallback. See [Accounts](#accounts) |
| `SESSION_SECRET` | For in-app accounts | *(`openssl rand -base64 48`)* | At least 32 chars. Encrypts the session cookie. Rotating it signs everyone out |
| `SHOPIFY_SHOP_ID` | No | `101438030190` | Only needed if discovery from `SHOPIFY_STORE_DOMAIN` fails |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET` | No | | Only for a **Confidential** client type. Leave empty for the recommended Public client |
| `SHOPIFY_REVALIDATION_SECRET` | For webhooks | *(random hex, or Shopify webhook signing secret)* | Authorizes `POST /api/revalidate` (HMAC or `?secret=`). Without it the endpoint returns 500 and content still refreshes hourly |

Never commit real tokens. `.env*` is git-ignored except `.env.example`. Only the **public** Storefront token is used; it is designed to be visible in browsers. Don't put the private Storefront token or an Admin API token in this app.

If the Shopify variables are missing, the app still builds and runs: Shopify pages show a "Shopify isn't connected yet" notice instead of crashing. CI builds this way on purpose.

## Architecture

```
src/
  lib/
    site.ts              site name, URLs, social links, getSiteUrl()/absoluteUrl()
    search-params.ts     tiny searchParams helper
    shopify/
      client.ts          server-only: env config + createStorefrontClient + storefrontFetch()
      fragments.ts       GraphQL fragments (image, product card, collection, cart)
      types.ts           typed shapes (built on hydrogen-react storefront-api-types)
      sort.ts            sort options → Storefront sortKey/reverse, PAGE_SIZE, cursor args
      tags.ts            cache tag names
      products.ts        getProducts, getProductPage, getProduct, recommendations, handles
      collections.ts     getCollections, getCollection (sorted + paginated products)
      search.ts          searchProducts, predictiveSearch
      shop.ts            shop info, policies, pages, getMenu("main-menu")
      cart.ts            cart queries/mutations (cache: "no-store"), cart cookie, buyer identity
    customer-account/
      config.ts          env config (null = hosted fallback)
      discovery.ts       .well-known discovery + env overrides + shop-id fallback
      oauth.ts           PKCE, authorize URL, code/refresh exchange, id_token check, logout URL
      session.ts         encrypted (JWE) cookie helpers
      auth.ts            server-only session reads (Data Access Layer)
      api.ts             Customer Account API GraphQL client + queries
  proxy.ts               /account/*: token refresh, noindex + no-store headers
  app/
    layout.tsx           fonts, metadata defaults, header/footer, cart drawer, analytics
    page.tsx             home: hero, collections, latest drops, shop CTA
    products/…           catalog + product pages
    collections/…        collection index + collection pages
    search/page.tsx      search results
    cart/                cart page + Server Actions (add/update/remove)
    account/             Customer Account API: login/authorize/logout route handlers,
                         overview, orders, orders/[id] (all noindex, request-time)
    policies/[handle]/   Shopify policies (privacy, refund, shipping, terms)
    pages/[handle]/      Shopify online-store pages (e.g. /pages/contact)
    api/revalidate/      Shopify webhook → revalidateTag
    api/search/suggest/  predictive search JSON for the header search box
    sitemap.ts, robots.ts, opengraph-image.tsx, error.tsx, global-error.tsx, not-found.tsx
  components/
    layout/              header, mobile nav, search box, footer, nav data
    account/             account menu (header + mobile), account UI, formatters
    cart/                cart context (useOptimistic), drawer, lines, button, cart view
    analytics/           consent banner + Shopify analytics events
    sections/            homepage/collection cards
    product-card.tsx, listing-controls.tsx, add-to-cart.tsx (ProductView), json-ld.tsx, …
```

How the pieces fit:

- **Storefront client.** `createStorefrontClient()` from Hydrogen React builds the API URL and SDK headers. All Storefront calls run on the server (`server-only`), so the browser only talks to Shopify for checkout (and analytics, if accepted).
- **Caching.** Catalog data uses Cache Components (`"use cache"` + `cacheLife("hours")` + `cacheTag(...)`), so pages are prerendered and refresh about every hour, or immediately via the webhook below. Tags: `products`, `product:<handle>`, `collections`, `collection:<handle>`, `menu`, `shop`.
- **Cart.** Storefront Cart API (`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cart`). The cart id lives in an **httpOnly**, `SameSite=Lax` cookie (`cartId`, 14 days, `Secure` in production). The layout starts loading the cart without awaiting it and passes the promise to a client `CartProvider`; the header count, drawer and `/cart` page read it under Suspense, so the static shell never waits on the cart. Edits apply instantly through `useOptimistic`, then Server Actions return the updated cart and call `refresh()`. If a cart has expired, the next add creates a new one.
- **Checkout.** The Checkout button links to the cart's `checkoutUrl`, Shopify's hosted checkout on `shop.twistedrealityentertainment.com`. Payments, taxes and shipping stay in Shopify.
- **404s.** Product, collection, policy and page routes look the item up before any Suspense boundary (`export const instant = false`) and call `notFound()`, so unknown handles return HTTP 404. The very first request for an unknown handle (a cache miss) may stream as `200` with `<meta name="robots" content="noindex">`, which is how Next.js handles a `notFound()` after streaming starts; once that lookup is cached, it returns `404`.

## On-demand revalidation (Shopify webhooks)

`POST /api/revalidate` expires cache tags as soon as something changes in Shopify. A request is authorized if **either** the `X-Shopify-Hmac-Sha256` signature verifies with `SHOPIFY_REVALIDATION_SECRET` **or** `?secret=` / `x-revalidation-secret` equals it.

**Option A — Admin API subscriptions (used by this store).** Generate a random secret (`openssl rand -hex 32`), set it as `SHOPIFY_REVALIDATION_SECRET` on Vercel (Production, Preview, Development) and redeploy. Then create one `webhookSubscriptionCreate` HTTP subscription (format `JSON`) per topic — `PRODUCTS_CREATE`, `PRODUCTS_UPDATE`, `PRODUCTS_DELETE`, `COLLECTIONS_CREATE`, `COLLECTIONS_UPDATE`, `COLLECTIONS_DELETE` — with callback URL `https://<your-site>/api/revalidate?secret=<secret>`. These deliveries are signed with the creating app's client secret, so the URL secret is what authorizes them. Treat the URL as a credential; rotate by changing the env var and re-creating the subscriptions.

**Option B — Shopify admin webhooks.**

1. Shopify admin → **Settings → Notifications → Webhooks** → **Create webhook**.
2. Create one webhook per event, format **JSON**, URL `https://<your-site>/api/revalidate`, latest API version:
   - Product creation, Product update, Product deletion
   - Collection creation, Collection update, Collection deletion
   - (optional) Inventory level update
3. Copy the signing secret shown at the bottom of the Webhooks page ("Your webhooks will be signed with …") into `SHOPIFY_REVALIDATION_SECRET` on Vercel, then redeploy.

The route maps `X-Shopify-Topic` to tags (`products/*` → `products` + `product:<handle>`, `collections/*` → `collections` + `collection:<handle>` + `products`) and calls `revalidateTag(tag, { expire: 0 })`. Unknown topics get a 200 so Shopify doesn't retry.

Manual refresh (e.g. after editing a menu or policy):

```bash
curl -X POST "https://<your-site>/api/revalidate?topic=all" -H "x-revalidation-secret: $SHOPIFY_REVALIDATION_SECRET"
```

`topic` can be `products`, `collections`, `menus`, `shop` or `all`; add `&handle=<handle>` to target one item.

## Analytics and consent

- **Vercel Web Analytics + Speed Insights** load on every page. They are cookieless and collect no personal data; enable them in the Vercel project settings.
- **Shopify analytics** (`page_view` on navigation, `add_to_cart` after a successful add) are sent with Hydrogen React's `sendShopifyAnalytics` **only after the visitor taps Accept** on the consent banner. Declining, or a browser sending **Global Privacy Control**, means nothing is sent. The choice is stored in `localStorage` (`tr-analytics-consent`).
- `useShopifyCookies` runs with `fetchTrackingValues: false`. In Hydrogen React 2026.4, Shopify's backend (Customer Privacy API) owns the `_shopify_y` / `_shopify_s` tracking cookies, and refreshing them from the browser needs a same-origin Storefront API proxy (`/api/unstable/graphql.json`) that only exists on Shopify-hosted/Oxygen domains. On Vercel that request would just 404, so it's skipped: events are still delivered to Shopify (verified: `monorail-edge.shopifysvc.com` receives `page_view` and `add_to_cart` after Accept), but they carry client-side visit ids only, so Shopify's own reports will attribute headless sessions less completely than Online Store sessions. Vercel Analytics is the reliable traffic source here.

## Accounts

Customers sign in on this site with Shopify's [Customer Account API](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started), using OAuth 2.0 Authorization Code + PKCE as a **Public** client. Everything runs on the server. Tokens live only in an encrypted cookie, and the browser never sees them.

### How it works

| Route | What it does |
| --- | --- |
| `GET /account/login?return_to=/account/orders` | Creates `state`, `nonce` and a PKCE verifier, stores them in a 10-minute encrypted httpOnly cookie (path `/account`), and 302s to Shopify's authorize endpoint (`scope=openid email customer-account-api:full`, `code_challenge_method=S256`). `return_to` accepts only relative paths |
| `GET /account/authorize` | Callback. Checks `state` (CSRF), exchanges the code with the verifier, verifies the `id_token` (JWKS signature, issuer, audience, nonce), loads the first name, links any existing cart to the customer, then sets the session cookie and redirects to `return_to` |
| `POST /account/logout` | Clears the session and redirects to Shopify's `end_session_endpoint` with `id_token_hint` and `post_logout_redirect_uri` set to the site URL. `GET` works too, but only for same-origin navigations |
| `/account` | Profile (name, email, phone, default address) and the 3 most recent orders |
| `/account/orders` | Order history, 10 per page, cursor pagination |
| `/account/orders/[id]` | Line items, totals, payment and fulfillment status, tracking links and the Shopify order status page |

- **Endpoints** are discovered from `https://<SHOPIFY_STORE_DOMAIN>/.well-known/openid-configuration` and `/.well-known/customer-account-api`, then memoized for an hour. For this store they resolve to `https://account.twistedrealityentertainment.com/authentication/oauth/{authorize,token}`, `/authentication/logout` and `/customer/api/<version>/graphql`. You can override any of them with `SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_URL`, `_TOKEN_URL`, `_LOGOUT_URL`, `_GRAPHQL_URL`, or pin the API version with `SHOPIFY_CUSTOMER_ACCOUNT_API_VERSION` (by default it uses the version discovery returns). If discovery is down and `SHOPIFY_SHOP_ID` is set, it falls back to `https://shopify.com/authentication/<shop_id>/…`.
- **Session.** `tr_customer_session` is a JWE (`dir` + `A256GCM`, key derived from `SESSION_SECRET`) that holds the access, refresh and id tokens, the expiry and the first name. The cookie is httpOnly, `Secure` in production, `SameSite=Lax` and lasts 30 days. `src/proxy.ts` runs on `/account/*` and refreshes the access token a minute before it expires, so Server Components only ever read cookies. A session that's unreadable or can't be refreshed is cleared, and the customer sees the sign-in panel.
- **Security.** CSRF is covered by `state` on login and by `SameSite=Lax` plus a POST form on logout. The `id_token` nonce is checked. Account pages send `noindex` (both the meta tag and `X-Robots-Tag`) and `Cache-Control: private, no-store`, and render at request time behind `<Suspense>` with every Customer Account API call set to `cache: "no-store"`. Route handlers call `connection()`, so they're never prerendered.
- **Header.** The header shows **Sign in**, or the customer's first name with a menu (Account, Orders, Sign out). The mobile drawer has the same entries. The static shell shows a plain account icon until the session streams in.
- **Cart.** On sign-in, an existing cart gets `cartBuyerIdentityUpdate` with `buyerIdentity.customerAccessToken` set to the Customer Account API access token. New carts created while signed in get the same token in `cartCreate`. That's the same thing Hydrogen's cart handler does, and it prefills checkout. Failures are ignored, because the cart still works without it.
- **Fallback.** If `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` or `SESSION_SECRET` is missing, `/account` shows a branded page whose **Sign in**, **Create account**, **Order history** and **Profile** links go to `https://account.twistedrealityentertainment.com` (`/orders`, `/profile`). `/account/login` redirects there too. Nothing crashes, and CI builds this way.

### Shopify admin setup (one time)

Do this once the production URL (for example `https://<project>.vercel.app` or your custom domain) is known. Below, `<site>` means that origin, with `https://` and no trailing slash.

1. **Settings → Customer accounts**: make sure **Customer accounts** (the new, passwordless kind) is selected. This store already uses them at `account.twistedrealityentertainment.com`.
2. **Sales channels → Headless → Next.js Starter Stack → Customer Account API**.
3. Under **Application setup**:
   - **Client type**: **Public**. Click **Edit** and save if it isn't already.
   - **Callback URI(s)**: `https://<site>/account/authorize`
   - **JavaScript origin(s)**: `https://<site>`
   - **Logout URI(s)**: `https://<site>`
   - Add each preview or custom domain you want sign-in to work on as its own set of three entries. Shopify accepts only HTTPS URLs, never `localhost`.
4. Under **Permissions**, keep the customer and order read permissions on (the defaults).
5. Under **Credentials**, copy the **Client ID**. A Public client has no secret.
6. **Shop ID** (optional): it's the number in the discovery `issuer`, e.g. `https://shopify.com/authentication/101438030190` → `101438030190`. You only need it if discovery fails. You can see it with `curl -s https://twistedrealityent.myshopify.com/.well-known/openid-configuration`.

### Vercel environment variables

Go to Project → **Settings → Environment Variables** and add these for Production (and Preview, if those URLs are registered in step 3):

| Name | Value |
| --- | --- |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID` | the Client ID from step 5 |
| `SESSION_SECRET` | output of `openssl rand -base64 48`. Generate it once, and keep it secret |
| `NEXT_PUBLIC_SITE_URL` | `https://<site>`, exactly the origin registered in step 3. The redirect URI is `${NEXT_PUBLIC_SITE_URL}/account/authorize` |

Then **redeploy**. `NEXT_PUBLIC_*` values and the header's hosted or in-app mode are fixed at build time.

### Local development

Shopify only redirects to HTTPS callbacks, so `http://localhost` can't finish a sign-in. Use a tunnel:

```bash
npm run build && npm start                    # or npm run dev
ngrok http 3000                               # or: cloudflared tunnel --url http://localhost:3000
# .env.local
NEXT_PUBLIC_SITE_URL=https://<your-tunnel-host>
```

Then add `https://<your-tunnel-host>/account/authorize`, `https://<your-tunnel-host>` (JavaScript origin) and `https://<your-tunnel-host>` (Logout) in the Application setup, and open the site through the tunnel URL. Remove those entries when you're done. Without the tunnel you can still check the flow: `/account/login` should 302 to Shopify with `code_challenge`, `state` and `redirect_uri`, and Shopify then answers `redirect_uri mismatch` until the URI is registered.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: `npm ci` → `npm run lint` → `npm run typecheck` → `npm run build`. It uses placeholder env values only, so no secrets are needed in GitHub; the build exercises the "not connected" path.

## Why Hydrogen React, not full Hydrogen

Full **Hydrogen** (`@shopify/hydrogen`, `npm create @shopify/hydrogen`) is Shopify's own framework. It is built on React Router 7 and Vite and is meant to be hosted on Shopify **Oxygen**. It can't run inside a Next.js app, and the `hydrogen` CLI (`setup`, `deploy`) only targets Hydrogen projects.

For Next.js on Vercel, Shopify's supported route is **`@shopify/hydrogen-react`**, the framework-agnostic package behind Hydrogen. It provides the Storefront client, Storefront API types, `ShopifyProvider`, `Image`, `Money`, cart components and more. This repo uses it with React 19 and Next 16; its peer range (`react ^19.2.3`) installs cleanly, so no peer-dependency overrides are needed.

## Moving to Hydrogen + Oxygen later

1. `npm create @shopify/hydrogen@latest` (choose TypeScript + Tailwind) and link the store with `npx shopify hydrogen link`.
2. Port the GraphQL in `src/lib/shopify/fragments.ts`, `products.ts` and `cart.ts`. The queries work as they are in Hydrogen's `context.storefront.query()`, and Hydrogen's `createCartHandler` replaces `cart.ts` and the cookie logic.
3. Move the UI. The JSX and Tailwind classes carry over, and `Image` and `Money` have the same API in `@shopify/hydrogen`. Turn the pages into React Router routes with `loader`s and the Server Actions into route `action`s.
4. Deploy with `npx shopify hydrogen deploy` (Oxygen is included with Shopify plans), then point the domain at the Hydrogen storefront.

## Deploy to Vercel

1. Import `clowery651-creator/nextjs-starter-stack` at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js, so leave the build settings at their defaults.
2. **Settings → Environment Variables**: add the variables in the table above (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_API_VERSION`, `NEXT_PUBLIC_SITE_URL`, `SHOPIFY_REVALIDATION_SECRET`) for Production and Preview (Development optional).
3. **Settings → Analytics / Speed Insights**: enable both so the `@vercel/analytics` and `@vercel/speed-insights` scripts report data.
4. Deploy. If you change env vars later, go to **Deployments → ⋯ → Redeploy**.
5. Every push to `main` deploys to production, and pull requests get preview URLs.
6. Set up the Shopify webhooks (see **On-demand revalidation**) pointing at the production URL.

## Deploy to Cloudflare Workers (free, optional)

The same app also builds for Cloudflare Workers with the official
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`).
Vercel is unaffected: every Cloudflare-only behavior is gated on
`NEXT_PUBLIC_DEPLOY_TARGET=cloudflare`, which only the `build:cf` / `preview` / `deploy` scripts set.

What differs on the Workers build:

- **Cache Components / PPR are off** (the adapter can't resume PPR shells reliably yet;
  see opennextjs/opennextjs-cloudflare#1115). Pages render dynamically; `"use cache"`
  still works via `experimental.useCache`. `scripts/cf-build.mjs` temporarily comments out
  the Cache Components-only `export const instant = false` lines during the build and
  restores them afterwards.
- **Images**: no Vercel optimizer, so `src/lib/image-loader.ts` asks Shopify's CDN to resize
  (`?width=`), which serves AVIF/WebP for free.
- **Vercel Analytics / Speed Insights** are not rendered (`src/lib/deploy-target.ts`).
- **Caching** (Workers Free, no R2/card): KV incremental cache, Durable Object queue and
  sharded Durable Object tag cache (`open-next.config.ts`, `wrangler.jsonc`), so
  `/api/revalidate` (Shopify webhooks) keeps working.
- Unknown product/collection handles return a streamed `200` + `noindex` instead of a hard `404`.

Commands:

```bash
npm run build:cf      # OpenNext build -> .open-next/
npm run preview       # build + run locally in workerd (put runtime vars in .dev.vars, gitignored)
npm run deploy        # build + deploy (needs `wrangler login` or CLOUDFLARE_API_TOKEN)
npm run cf-typegen    # generate cloudflare-env.d.ts binding types
```

Runtime env vars are the same as Vercel's (table above). Set them as Worker secrets
(`wrangler secret bulk <file>`), never in `wrangler.jsonc`. `NEXT_PUBLIC_*` values are inlined at
build time, so they must also be present in the shell that runs the build. Customer accounts need
`<worker URL>/account/authorize` added to the Customer Account API callback URLs (and
`NEXT_PUBLIC_SITE_URL` pointed at that URL) before login works on a Workers hostname.
