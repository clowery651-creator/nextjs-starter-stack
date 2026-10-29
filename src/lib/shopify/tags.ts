/** Cache tags used with cacheTag() and invalidated by /api/revalidate. */
export const TAGS = {
  products: "products",
  product: (handle: string) => `product:${handle}`,
  collections: "collections",
  collection: (handle: string) => `collection:${handle}`,
  menu: "menu",
  shop: "shop",
} as const;
