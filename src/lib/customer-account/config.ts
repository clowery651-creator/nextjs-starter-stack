/**
 * Customer Account API configuration (env only, no network).
 *
 * In-app accounts turn on when BOTH are set:
 *   SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID  (Headless → storefront → Customer Account API → Credentials)
 *   SESSION_SECRET                      (≥ 32 random chars, encrypts the session cookie)
 * Otherwise the site falls back to Shopify-hosted accounts (CUSTOMER_ACCOUNT_URL).
 *
 * Imported by both server code and src/proxy.ts, so it must not import
 * next/headers or "server-only".
 */

export type CustomerAccountConfig = {
  clientId: string;
  /** Only for a Confidential client. Public clients (recommended here) use PKCE only. */
  clientSecret?: string;
  sessionSecret: string;
  /** myshopify (or custom) domain used for discovery. */
  shopDomain: string;
  /** Optional numeric shop id; enables endpoint fallback without discovery. */
  shopId?: string;
  /** Optional Customer Account API version pin, e.g. "2026-10". Default: version from discovery. */
  apiVersion?: string;
  overrides: {
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    endSessionEndpoint?: string;
    graphqlEndpoint?: string;
  };
};

const MIN_SECRET_LENGTH = 32;
let warned = false;

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

/** Returns null (never throws) when in-app accounts aren't configured. */
export function getCustomerAccountConfig(): CustomerAccountConfig | null {
  const clientId = env("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID");
  if (!clientId) return null;
  const sessionSecret = env("SESSION_SECRET");
  if (!sessionSecret || sessionSecret.length < MIN_SECRET_LENGTH) {
    if (!warned) {
      warned = true;
      console.warn(
        `[accounts] SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID is set but SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} chars. Falling back to Shopify-hosted accounts.`,
      );
    }
    return null;
  }
  const shopDomain = (env("SHOPIFY_STORE_DOMAIN") ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const shopId = env("SHOPIFY_SHOP_ID");
  if (!shopDomain && !shopId) {
    if (!warned) {
      warned = true;
      console.warn("[accounts] Set SHOPIFY_STORE_DOMAIN (or SHOPIFY_SHOP_ID) for Customer Account API discovery.");
    }
    return null;
  }
  return {
    clientId,
    clientSecret: env("SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET"),
    sessionSecret,
    shopDomain,
    shopId,
    apiVersion: env("SHOPIFY_CUSTOMER_ACCOUNT_API_VERSION"),
    overrides: {
      authorizationEndpoint: env("SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_URL"),
      tokenEndpoint: env("SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_URL"),
      endSessionEndpoint: env("SHOPIFY_CUSTOMER_ACCOUNT_LOGOUT_URL"),
      graphqlEndpoint: env("SHOPIFY_CUSTOMER_ACCOUNT_GRAPHQL_URL"),
    },
  };
}

export function isCustomerAccountEnabled(): boolean {
  return getCustomerAccountConfig() !== null;
}
