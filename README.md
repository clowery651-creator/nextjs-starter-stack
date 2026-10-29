# nextjs-starter-stack

Starter for Twisted Reality E.N.T.: Next.js (App Router) + TypeScript + Tailwind CSS, with a typed Shopify Storefront API helper, ready to deploy on Vercel.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/` dir, Cache Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Linting | ESLint (`eslint-config-next`) |
| Commerce | Shopify Storefront API (GraphQL) via `src/lib/shopify.ts` |
| Hosting | Vercel (preview deploys on PRs, production on `main`) |
| Planning | Linear project "Tech Stack Setup", Notion "Launch Calendar & Tasks" |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Shopify values
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Shopify environment variables

| Variable | Example | Notes |
| --- | --- | --- |
| `SHOPIFY_STORE_DOMAIN` | `twistedrealityent.myshopify.com` | The custom domain `shop.twistedrealityentertainment.com` also works |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | *(public Storefront token)* | Shopify admin → Sales channels → **Headless** → Create storefront → Storefront API |
| `SHOPIFY_STOREFRONT_API_VERSION` | `2025-01` | Storefront API version |

Never commit `.env.local`. `.env*` is git-ignored except `.env.example`.

`/products` lists products through the helper. If the env vars are missing it shows a "Shopify isn't connected yet" notice instead of failing, so the build passes without secrets.

## Using the Shopify helper

```ts
import { shopifyFetch, getProducts } from "@/lib/shopify";

const products = await getProducts(12);

const data = await shopifyFetch<{ shop: { name: string } }>({
  query: `{ shop { name } }`,
});
```

The helper is server-only, so the token never reaches the browser bundle.

## Deploy to Vercel

1. Push this repo to GitHub (`clowery651-creator/nextjs-starter-stack`).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Vercel detects Next.js automatically, so leave the build settings at their defaults.
3. Under **Environment Variables**, add the three Shopify variables above for **Production** and **Preview**.
4. Click **Deploy**. Every push to `main` deploys to production; every pull request gets a preview URL.
5. Optional: add a custom subdomain (for example `app.twistedrealityentertainment.com`) in Vercel → Domains, then add the CNAME record Vercel shows to your DNS.

CLI alternative:

```bash
npm i -g vercel
vercel link
vercel env add SHOPIFY_STORE_DOMAIN
vercel env add SHOPIFY_STOREFRONT_ACCESS_TOKEN
vercel env add SHOPIFY_STOREFRONT_API_VERSION
vercel --prod
```

## Hydrogen vs Next.js Commerce

- **This starter / Next.js Commerce on Vercel**: one Next.js codebase, Vercel previews, works alongside the existing Shopify Online Store.
- **Shopify Hydrogen on Oxygen**: Shopify's own React Router-based framework with free Oxygen hosting and the deepest Shopify integration, but a separate codebase.

The Storefront API helper here works either way, so the decision can wait until the storefront design is set.
