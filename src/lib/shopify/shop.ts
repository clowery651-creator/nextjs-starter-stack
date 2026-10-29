import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getShopifyConfig, storefrontFetch } from "./client";
import { TAGS } from "./tags";
import type { NavItem, Policy, ShopInfo, ShopPage } from "./types";
import { SHOP_URL } from "../site";

const SHOP_QUERY = /* GraphQL */ `
  query Shop {
    shop {
      id
      name
      description
      primaryDomain { url }
      privacyPolicy { title handle url }
      refundPolicy { title handle url }
      shippingPolicy { title handle url }
      termsOfService { title handle url }
    }
  }
`;

const POLICIES_QUERY = /* GraphQL */ `
  query Policies {
    shop {
      privacyPolicy { title handle url body }
      refundPolicy { title handle url body }
      shippingPolicy { title handle url body }
      termsOfService { title handle url body }
    }
  }
`;

const MENU_QUERY = /* GraphQL */ `
  query Menu($handle: String!) {
    menu(handle: $handle) {
      items { title url type }
    }
  }
`;

const PAGE_QUERY = /* GraphQL */ `
  query Page($handle: String!) {
    page(handle: $handle) {
      id handle title body bodySummary updatedAt
      seo { title description }
    }
  }
`;

type RawShop = {
  id: string;
  name: string;
  description: string | null;
  primaryDomain: { url: string };
  privacyPolicy: Policy | null;
  refundPolicy: Policy | null;
  shippingPolicy: Policy | null;
  termsOfService: Policy | null;
};

function policiesOf(shop: Omit<RawShop, "id" | "name" | "description" | "primaryDomain">) {
  return [shop.privacyPolicy, shop.refundPolicy, shop.shippingPolicy, shop.termsOfService].filter(
    (p): p is Policy => Boolean(p),
  );
}

export async function getShopInfo(): Promise<ShopInfo> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.shop);
  const { shop } = await storefrontFetch<{ shop: RawShop }>({ query: SHOP_QUERY });
  return {
    id: shop.id,
    name: shop.name,
    description: shop.description,
    primaryDomainUrl: shop.primaryDomain.url,
    policies: policiesOf(shop),
  };
}

export async function getPolicy(handle: string): Promise<Policy | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.shop);
  const { shop } = await storefrontFetch<{
    shop: Omit<RawShop, "id" | "name" | "description" | "primaryDomain">;
  }>({ query: POLICIES_QUERY });
  return policiesOf(shop).find((p) => p.handle === handle) ?? null;
}

export async function getPage(handle: string): Promise<ShopPage | null> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.shop, `page:${handle}`);
  const data = await storefrontFetch<{ page: ShopPage | null }>({
    query: PAGE_QUERY,
    variables: { handle },
  });
  return data.page;
}

/**
 * Turn a Shopify menu URL (absolute, on the Online Store domain) into an
 * in-app path when this storefront has a matching route.
 */
export function toAppHref(url: string, shopDomains: string[]): NavItem["href"] | null {
  let parsed: URL;
  try {
    parsed = new URL(url, SHOP_URL);
  } catch {
    return null;
  }
  if (!shopDomains.includes(parsed.hostname)) return null;
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "/";
  if (path === "/collections/all" || path === "/products") return "/products";
  if (path === "/collections") return "/collections";
  if (path === "/search") return "/search";
  if (/^\/(collections|products|pages|policies)\/[^/]+$/.test(path)) return path;
  return null;
}

/**
 * Header navigation from the Shopify menu (default handle "main-menu").
 * Returns null when the menu doesn't exist, so callers can fall back.
 */
export async function getMenu(handle = "main-menu"): Promise<NavItem[] | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.menu);
  const data = await storefrontFetch<{
    menu: { items: { title: string; url: string | null; type: string }[] } | null;
  }>({ query: MENU_QUERY, variables: { handle } });
  if (!data.menu) return null;
  const config = getShopifyConfig();
  const domains = [new URL(SHOP_URL).hostname, config?.storeDomain ?? ""].filter(Boolean);
  const items: NavItem[] = [];
  for (const item of data.menu.items) {
    if (!item.url || item.type === "FRONTPAGE") continue;
    const href = toAppHref(item.url, domains);
    items.push(
      href ? { title: item.title, href, external: false } : { title: item.title, href: item.url, external: true },
    );
  }
  return items;
}
