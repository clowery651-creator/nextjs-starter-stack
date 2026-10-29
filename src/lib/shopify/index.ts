import "server-only";

export {
  DEFAULT_STOREFRONT_API_VERSION,
  ShopifyNotConfiguredError,
  getShopifyConfig,
  getStorefrontClient,
  isShopifyConfigured,
  storefrontFetch,
} from "./client";
export {
  getAllProductHandles,
  getProduct,
  getProductPage,
  getProductRecommendations,
  getProducts,
} from "./products";
export { getCollection, getCollectionProducts, getCollections } from "./collections";
export type { CollectionSummary } from "./collections";
export { predictiveSearch, searchProducts } from "./search";
export type { PredictiveResult, SearchResult } from "./search";
export { getMenu, getPage, getPolicy, getShopInfo } from "./shop";
export {
  CART_COOKIE,
  addCartLines,
  createCart,
  getCart,
  getCartId,
  linkCartToCustomer,
  removeCartLines,
  updateCartLines,
} from "./cart";
export { TAGS } from "./tags";
export type * from "./types";
