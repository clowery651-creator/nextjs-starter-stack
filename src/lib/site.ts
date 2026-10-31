/**
 * Site-wide constants and the canonical base URL. Safe to import anywhere
 * (no secrets here).
 */

export const SITE_NAME = "Twisted Reality E.N.T.";
export const SITE_SHORT_NAME = "Twisted Reality";
export const SITE_TAGLINE = "Apparel · Music · Events";
export const SITE_DESCRIPTION =
  "Twisted Reality E.N.T. — streetwear apparel, music and events. Shop the latest drops.";

/** Shopify Online Store domain (checkout and Shopify-hosted pages live here). */
export const SHOP_URL = "https://shop.twistedrealityentertainment.com";
/** Shopify customer accounts (new customer accounts, hosted by Shopify). */
export const CUSTOMER_ACCOUNT_URL = "https://account.twistedrealityentertainment.com";
/** Hosted order history and profile (used when in-app accounts aren't configured). */
export const CUSTOMER_ACCOUNT_ORDERS_URL = `${CUSTOMER_ACCOUNT_URL}/orders`;
export const CUSTOMER_ACCOUNT_PROFILE_URL = `${CUSTOMER_ACCOUNT_URL}/profile`;

export const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: "Pinterest", href: "https://www.pinterest.com/twistedrealityent/" },
];

/**
 * Canonical origin, no trailing slash.
 * 1. NEXT_PUBLIC_SITE_URL (set this to your custom domain in production)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (Vercel system env, no protocol)
 * 3. VERCEL_URL (per-deployment URL, previews)
 * 4. http://localhost:3000
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const raw =
    explicit ||
    (vercelProd ? `https://${vercelProd}` : "") ||
    (vercelUrl ? `https://${vercelUrl}` : "") ||
    "http://localhost:3000";
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * True only for the Cloudflare Workers test copy on *.workers.dev. Used to keep
 * that copy out of search engines. Always false on Vercel.
 */
export function isWorkersDevTestCopy(): boolean {
  if (process.env.NEXT_PUBLIC_DEPLOY_TARGET?.trim() !== "cloudflare") return false;
  try {
    return new URL(getSiteUrl()).hostname.endsWith(".workers.dev");
  } catch {
    return false;
  }
}
