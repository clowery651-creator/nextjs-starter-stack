import type { NextConfig } from "next";

// Cloudflare Workers build (OpenNext): no Vercel image optimizer, so use a
// free loader (Shopify CDN resizing). Vercel builds are unchanged.
const isCloudflare = process.env.NEXT_PUBLIC_DEPLOY_TARGET?.trim() === "cloudflare";

// Cloudflare test copy on *.workers.dev: send X-Robots-Tag so it stays out of
// search results. Never true on Vercel (requires the cloudflare target).
const isWorkersDevTestCopy = (() => {
  if (!isCloudflare) return false;
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "").hostname.endsWith(".workers.dev");
  } catch {
    return false;
  }
})();

const nextConfig: NextConfig = {
  // Cache Components / PPR on Vercel. The OpenNext Cloudflare adapter can't yet
  // resume PPR shells reliably (blank pages, React #419/#441; see
  // opennextjs/opennextjs-cloudflare#1115, #1349, #1369), so the Workers build
  // renders dynamically and keeps "use cache" data caching via experimental.useCache.
  cacheComponents: !isCloudflare,
  partialPrefetching: !isCloudflare,
  ...(isCloudflare ? { experimental: { useCache: true } } : {}),
  images: {
    // Shopify product, collection and file images.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" }],
    formats: ["image/avif", "image/webp"],
    ...(isCloudflare ? { loader: "custom" as const, loaderFile: "./src/lib/image-loader.ts" } : {}),
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          // CSP-lite: hardening directives that don't restrict scripts/styles,
          // so Shopify, Vercel Analytics and checkout redirects keep working.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests",
          },
          ...(isWorkersDevTestCopy ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Lets `next dev` use local Cloudflare bindings (getCloudflareContext). Only
// when explicitly opted in, so Vercel/CI builds never load wrangler.
if (process.env.NEXT_PUBLIC_DEPLOY_TARGET?.trim() === "cloudflare" && process.env.NODE_ENV === "development") {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
