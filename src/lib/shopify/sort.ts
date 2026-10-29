/**
 * URL-friendly sort options mapped to Storefront API sort keys.
 * Safe for client and server.
 */
export type SortOption = {
  slug: string;
  label: string;
  /** ProductCollectionSortKeys (collection.products) */
  collectionKey: string;
  /** ProductSortKeys (products) */
  productKey: string;
  /** SearchSortKeys (search) — only RELEVANCE and PRICE exist */
  searchKey: "RELEVANCE" | "PRICE";
  reverse: boolean;
};

export const SORT_OPTIONS: SortOption[] = [
  { slug: "featured", label: "Featured", collectionKey: "COLLECTION_DEFAULT", productKey: "BEST_SELLING", searchKey: "RELEVANCE", reverse: false },
  { slug: "best-selling", label: "Best selling", collectionKey: "BEST_SELLING", productKey: "BEST_SELLING", searchKey: "RELEVANCE", reverse: false },
  { slug: "newest", label: "Newest", collectionKey: "CREATED", productKey: "CREATED_AT", searchKey: "RELEVANCE", reverse: true },
  { slug: "price-asc", label: "Price: low to high", collectionKey: "PRICE", productKey: "PRICE", searchKey: "PRICE", reverse: false },
  { slug: "price-desc", label: "Price: high to low", collectionKey: "PRICE", productKey: "PRICE", searchKey: "PRICE", reverse: true },
  { slug: "title-asc", label: "A–Z", collectionKey: "TITLE", productKey: "TITLE", searchKey: "RELEVANCE", reverse: false },
];

export const DEFAULT_SORT = SORT_OPTIONS[0];

export function getSort(slug: string | null | undefined): SortOption {
  return SORT_OPTIONS.find((s) => s.slug === slug) ?? DEFAULT_SORT;
}

export const PAGE_SIZE = 12;

/** Cursor pagination args from ?after= / ?before= */
export function pageArgs(after?: string | null, before?: string | null) {
  if (before) return { last: PAGE_SIZE, before, first: null, after: null };
  return { first: PAGE_SIZE, after: after || null, last: null, before: null };
}
