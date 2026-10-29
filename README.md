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
| Accounts | `/account` page that links to Shopify customer accounts at `account.twistedrealityentertainment.com` (no custom OAuth) |
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
| `SHOPIFY_REVALIDATION_SECRET` | For webhooks | *(Shopify webhook signing secret)* | Verifies Shopify webhooks on `POST /api/revalidate`. Without it the endpoint returns 500 and content still refreshes hourly |

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
      cart.ts            cart queries/mutations (cache: "no-store"), cart cookie
  app/
    layout.tsx           fonts, metadata defaults, header/footer, cart drawer, analytics
    page.tsx             home: hero, collections, latest drops, shop CTA
    products/…           catalog + product pages
    collections/…        collection index + collection pages
    search/page.tsx      search results
    cart/                cart page + Server Actions (add/update/remove)
    account/page.tsx     customer accounts hand-off
    policies/[handle]/   Shopify policies (privacy, refund, shipping, terms)
    pages/[handle]/      Shopify online-store pages (e.g. /pages/contact)
    api/revalidate/      Shopify webhook → revalidateTag
    api/search/suggest/  predictive search JSON for the header search box
    sitemap.ts, robots.ts, opengraph-image.tsx, error.tsx, global-error.tsx, not-found.tsx
  components/
    layout/              header, mobile nav, search box, footer, nav data
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

`POST /api/revalidate` expires cache tags as soon as something changes in Shopify.

1. Shopify admin → **Settings → Notifications → Webhooks** → **Create webhook**.
2. Create one webhook per event, format **JSON**, URL `https://<your-site>/api/revalidate`, latest API version:
   - Product creation, Product update, Product deletion
   - Collection creation, Collection update, Collection deletion
   - (optional) Inventory level update
3. Copy the signing secret shown at the bottom of the Webhooks page ("Your webhooks will be signed with …") into `SHOPIFY_REVALIDATION_SECRET` on Vercel, then redeploy.

The route verifies `X-Shopify-Hmac-Sha256` against that secret, maps `X-Shopify-Topic` to tags (`products/*` → `products` + `product:<handle>`, `collections/*` → `collections` + `collection:<handle>` + `products`), and calls `revalidateTag(tag, { expire: 0 })`. Unknown topics get a 200 so Shopify doesn't retry.

Manual refresh (e.g. after editing a menu or policy):

```bash
curl -X POST "https://<your-site>/api/revalidate?topic=all" -H "x-revalidation-secret: $SHOPIFY_REVALIDATION_SECRET"
```

`topic` can be `products`, `collections`, `menus`, `shop` or `all`; add `&handle=<handle>` to target one item.

## Analytics and consent

- **Vercel Web Analytics + Speed Insights** load on every page. They are cookieless and collect no personal data; enable them in the Vercel project settings.
- **Shopify analytics** (`page_view` on navigation, `add_to_cart` after a successful add) are sent with Hydrogen React's `sendShopifyAnalytics` **only after the visitor taps Accept** on the consent banner. Declining, or a browser sending **Global Privacy Control**, means nothing is sent. The choice is stored in `localStorage` (`tr-analytics-consent`).
- `useShopifyCookies` runs with `fetchTrackingValues: false`. In Hydrogen React 2026.4, Shopify's backend (Customer Privacy API) owns the `_shopify_y` / `_shopify_s` tracking cookies, and refreshing them from the browser needs a same-origin Storefront API proxy (`/api/unstable/graphql.json`) that only exists on Shopify-hosted/Oxygen domains. On Vercel that request would just 404, so it's skipped: events are still delivered to Shopify (verified: `monorail-edge.shopifysvc.com` receives `page_view` and `add_to_cart` after Accept), but they carry client-side visit ids only, so Shopify's own reports will attribute headless sessions less completely than Online Store sessions. Vercel Analytics is the reliable traffic source here.

## Customer accounts

`/account` links to Shopify's hosted customer accounts at `https://account.twistedrealityentertainment.com` (orders, addresses, profile). There's no custom OAuth in this app. To add in-app account pages later, use the Customer Account API with a confidential client registered under the Headless channel.

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
