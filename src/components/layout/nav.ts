import "server-only";
import { getCollections, getMenu, getShopInfo, isShopifyConfigured } from "@/lib/shopify";
import type { NavItem, Policy } from "@/lib/shopify/types";

const FALLBACK: NavItem[] = [
  { title: "Shop all", href: "/products", external: false },
  { title: "Collections", href: "/collections", external: false },
];

/** Shopify "main-menu", falling back to collections, then static links. */
export async function getNavItems(): Promise<NavItem[]> {
  if (!isShopifyConfigured()) return FALLBACK;
  try {
    const menu = await getMenu("main-menu");
    if (menu && menu.length) return menu;
  } catch (err) {
    console.error("[nav] menu failed", err);
  }
  try {
    const collections = await getCollections();
    return [
      { title: "Shop all", href: "/products", external: false },
      ...collections.slice(0, 5).map((c) => ({ title: c.title, href: `/collections/${c.handle}`, external: false })),
    ];
  } catch (err) {
    console.error("[nav] collections failed", err);
    return FALLBACK;
  }
}

export async function getPolicies(): Promise<Policy[]> {
  if (!isShopifyConfigured()) return [];
  try {
    return (await getShopInfo()).policies;
  } catch (err) {
    console.error("[nav] policies failed", err);
    return [];
  }
}
