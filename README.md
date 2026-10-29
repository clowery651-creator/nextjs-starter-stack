# nextjs-starter-stack

Storefront for Twisted Reality E.N.T.: Next.js (App Router) + TypeScript + Tailwind CSS, with a Shopify storefront built on **Hydrogen React** (`@shopify/hydrogen-react`): product list, product pages with variant selection, and a real Storefront API cart that hands off to Shopify checkout. Deploys to Vercel.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/` dir, Cache Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Commerce | Shopify Storefront API **2026-04** via `@shopify/hydrogen-react` 2026.4.x |
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

## Environment variables

| Variable | Example | Notes |
| --- | --- | --- |
| `SHOPIFY_STORE_DOMAIN` | `twistedrealityent.myshopify.com` | Custom domain `shop.twistedrealityentertainment.com` also works |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | *(public Storefront token)* | Shopify admin → Sales channels → **Headless** → storefront → Storefront API → **Public access token** |
| `SHOPIFY_STOREFRONT_API_VERSION` | `2026-04` | Optional. Defaults to `2026-04`, the version Hydrogen React 2026.4.x is built for |

Never commit real tokens. `.env*` is git-ignored except `.env.example`. Only the **public** Storefront token is used; it is designed to be visible in browsers. Don't put the private Storefront token or an Admin API token in this app.

If the variables are missing, every Shopify page shows a "Shopify isn't connected yet" notice instead of crashing, so builds pass without secrets.

## Architecture

```
src/
  lib/shopify/
    client.ts      server-only: env config + Hydrogen React createStorefrontClient + storefrontFetch()
    fragments.ts   GraphQL fragments (image, product card, cart)
    types.ts       typed shapes (built on hydrogen-react storefront-api-types)
    products.ts    getProducts(), getProduct(handle)   → "use cache", cacheLife("hours"), tag "products"
    cart.ts        getCart, createCart, addCartLines, updateCartLines, removeCartLines (cache: "no-store")
    index.ts       barrel (import from "@/lib/shopify")
  app/
    layout.tsx               <Providers> (Hydrogen React ShopifyProvider) + <Header> with cart count
    products/page.tsx        product grid: hydrogen-react <Image> + <Money>
    products/[handle]/page.tsx  product page, pre-rendered for every product, revalidated hourly
    cart/page.tsx            cart lines, +/- quantity, remove, subtotal, Checkout → cart.checkoutUrl
    cart/actions.ts          Server Actions: addToCart, updateLineQuantity, removeLine
  components/
    hydrogen.tsx     "use client" re-export of Hydrogen React Image/Money/ShopifyProvider
    providers.tsx    ShopifyProvider (US / EN) when configured
    add-to-cart.tsx  variant selector + add-to-cart form (useActionState)
    header.tsx       nav + live cart count (streams in under Suspense)
```

How the pieces fit:

- **Storefront client.** `createStorefrontClient()` from Hydrogen React builds the API URL and SDK headers. All Storefront calls run on the server (`server-only`), so nothing in the browser talks to Shopify directly except the final checkout redirect.
- **Caching.** Product data uses Next.js Cache Components (`"use cache"` + `cacheLife("hours")`), so it refreshes about every hour. To refresh immediately, call `revalidateTag("products")` (for example from a Shopify product webhook route). The cart is never cached: it reads a cookie and fetches with `cache: "no-store"`.
- **Cart.** Built on the Storefront Cart API (`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cart`). The cart id lives in an **httpOnly**, `SameSite=Lax` cookie (`cartId`, 14 days, `Secure` in production). Mutations are Server Actions, which call `refresh()` so the page and header count update. If a cart has expired, the next add creates a new one.
- **Checkout.** The Checkout button links to the cart's `checkoutUrl`, which is Shopify's hosted checkout on the store's primary domain (`shop.twistedrealityentertainment.com`). Payments, taxes and shipping all stay in Shopify.
- **Hydrogen React components.** They use React context, so they render as Client Components (`components/hydrogen.tsx`). They still server-render to HTML.

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
2. **Settings → Environment Variables**: add the three variables above for Production, Preview and Development.
3. Deploy. If you change env vars later, go to **Deployments → ⋯ → Redeploy**.
4. Every push to `main` deploys to production, and pull requests get preview URLs.
