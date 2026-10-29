import type { MetadataRoute } from "next";
import { getAllProductHandles, getCollections, getShopInfo, isShopifyConfigured } from "@/lib/shopify";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/collections"), changeFrequency: "weekly", priority: 0.8 },
  ];
  if (!isShopifyConfigured()) return entries;

  const [collections, products, shop] = await Promise.allSettled([
    getCollections(),
    getAllProductHandles(),
    getShopInfo(),
  ]);
  if (collections.status === "fulfilled") {
    for (const c of collections.value) {
      entries.push({
        url: absoluteUrl(`/collections/${c.handle}`),
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }
  if (products.status === "fulfilled") {
    for (const p of products.value) {
      entries.push({
        url: absoluteUrl(`/products/${p.handle}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  if (shop.status === "fulfilled") {
    for (const p of shop.value.policies) {
      entries.push({ url: absoluteUrl(`/policies/${p.handle}`), changeFrequency: "yearly", priority: 0.2 });
    }
  }
  return entries;
}
