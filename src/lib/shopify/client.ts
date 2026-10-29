import "server-only";
import { createStorefrontClient } from "@shopify/hydrogen-react/storefront-client";

/**
 * Storefront API version this app targets. Matches the version
 * @shopify/hydrogen-react 2026.4.x is built for (SFAPI 2026-04).
 * Override with SHOPIFY_STOREFRONT_API_VERSION if you need to pin another.
 */
export const DEFAULT_STOREFRONT_API_VERSION = "2026-04";

export type ShopifyConfig = {
  storeDomain: string;
  publicStorefrontToken: string;
  storefrontApiVersion: string;
};

export class ShopifyNotConfiguredError extends Error {
  constructor() {
    super(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.",
    );
    this.name = "ShopifyNotConfiguredError";
  }
}

/** Reads env vars. Returns null (never throws) when they're missing. */
export function getShopifyConfig(): ShopifyConfig | null {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  if (!rawDomain || !token) return null;
  return {
    storeDomain: rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
    publicStorefrontToken: token,
    storefrontApiVersion:
      process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() ||
      DEFAULT_STOREFRONT_API_VERSION,
  };
}

export function isShopifyConfigured(): boolean {
  return getShopifyConfig() !== null;
}

/** Hydrogen React Storefront client, or null when env vars are missing. */
export function getStorefrontClient() {
  const config = getShopifyConfig();
  if (!config) return null;
  return createStorefrontClient({
    storeDomain: config.storeDomain,
    publicStorefrontToken: config.publicStorefrontToken,
    storefrontApiVersion: config.storefrontApiVersion,
  });
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

/**
 * Server-only Storefront API GraphQL request.
 * `cache` defaults to "no-store"; product reads are cached one level up with
 * the "use cache" directive (see products.ts).
 */
export async function storefrontFetch<TData, TVariables = Record<string, unknown>>({
  query,
  variables,
  cache = "no-store",
}: {
  query: string;
  variables?: TVariables;
  cache?: RequestCache;
}): Promise<TData> {
  const client = getStorefrontClient();
  if (!client) throw new ShopifyNotConfiguredError();

  const res = await fetch(client.getStorefrontApiUrl(), {
    method: "POST",
    headers: client.getPublicTokenHeaders({ contentType: "json" }),
    body: JSON.stringify({ query, variables }),
    cache,
  });

  if (!res.ok) {
    throw new Error(`Shopify Storefront API error: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as GraphQLResponse<TData>;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Shopify Storefront API returned no data");
  return json.data;
}
