import "server-only";

/**
 * Minimal typed Shopify Storefront API GraphQL client.
 * Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN, SHOPIFY_STOREFRONT_API_VERSION
 */

export type ShopifyConfig = {
  domain: string;
  token: string;
  apiVersion: string;
};

export class ShopifyNotConfiguredError extends Error {
  constructor() {
    super(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.",
    );
    this.name = "ShopifyNotConfiguredError";
  }
}

export function getShopifyConfig(): ShopifyConfig | null {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  if (!rawDomain || !token) return null;
  const domain = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const apiVersion =
    process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2025-01";
  return { domain, token, apiVersion };
}

export function isShopifyConfigured(): boolean {
  return getShopifyConfig() !== null;
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function shopifyFetch<TData, TVariables = Record<string, unknown>>({
  query,
  variables,
}: {
  query: string;
  variables?: TVariables;
}): Promise<TData> {
  const config = getShopifyConfig();
  if (!config) throw new ShopifyNotConfiguredError();

  const res = await fetch(
    `https://${config.domain}/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

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

export type Money = { amount: string; currencyCode: string };

export type Product = {
  id: string;
  handle: string;
  title: string;
  onlineStoreUrl: string | null;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: Money };
};

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        onlineStoreUrl
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;

export async function getProducts(first = 24): Promise<Product[]> {
  const data = await shopifyFetch<
    { products: { nodes: Product[] } },
    { first: number }
  >({ query: PRODUCTS_QUERY, variables: { first } });
  return data.products.nodes;
}

export function formatMoney({ amount, currencyCode }: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}
