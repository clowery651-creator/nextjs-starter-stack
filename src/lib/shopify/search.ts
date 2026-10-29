import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { storefrontFetch } from "./client";
import { IMAGE_FRAGMENT, PAGE_INFO_FRAGMENT, PRODUCT_CARD_FRAGMENT } from "./fragments";
import { getSort, pageArgs } from "./sort";
import { TAGS } from "./tags";
import type { Connection, ProductCard, ShopifyImage } from "./types";

const SEARCH_QUERY = /* GraphQL */ `
  query Search(
    $query: String!
    $first: Int
    $last: Int
    $after: String
    $before: String
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) {
    search(
      query: $query
      types: [PRODUCT]
      unavailableProducts: LAST
      prefix: LAST
      first: $first
      last: $last
      after: $after
      before: $before
      sortKey: $sortKey
      reverse: $reverse
    ) {
      totalCount
      nodes { ... on Product { ...ProductCardFields } }
      pageInfo { ...PageInfoFields }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

const PREDICTIVE_QUERY = /* GraphQL */ `
  query Predictive($query: String!) {
    predictiveSearch(query: $query, limit: 6, types: [PRODUCT, COLLECTION, QUERY]) {
      queries { text styledText }
      products {
        id
        handle
        title
        featuredImage { ...ImageFields }
        priceRange { minVariantPrice { amount currencyCode } }
      }
      collections { id handle title }
    }
  }
  ${IMAGE_FRAGMENT}
`;

export type SearchResult = Connection<ProductCard> & { totalCount: number };

/** Full-text product search (Storefront `search`). Cached per query/sort/page. */
export async function searchProducts(
  query: string,
  { sort, after, before }: { sort?: string; after?: string; before?: string } = {},
): Promise<SearchResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.products);
  const s = getSort(sort);
  const data = await storefrontFetch<{
    search: Connection<ProductCard | Record<string, never>> & { totalCount: number };
  }>({
    query: SEARCH_QUERY,
    variables: {
      query,
      ...pageArgs(after, before),
      sortKey: s.searchKey,
      reverse: s.searchKey === "PRICE" ? s.reverse : false,
    },
  });
  return {
    totalCount: data.search.totalCount,
    pageInfo: data.search.pageInfo,
    nodes: data.search.nodes.filter((n): n is ProductCard => "handle" in n),
  };
}

export type PredictiveResult = {
  queries: { text: string }[];
  products: {
    id: string;
    handle: string;
    title: string;
    featuredImage: ShopifyImage | null;
    priceRange: { minVariantPrice: ProductCard["priceRange"]["minVariantPrice"] };
  }[];
  collections: { id: string; handle: string; title: string }[];
};

/** Type-ahead suggestions (Storefront `predictiveSearch`). */
export async function predictiveSearch(query: string): Promise<PredictiveResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.products, TAGS.collections);
  const data = await storefrontFetch<{ predictiveSearch: PredictiveResult | null }>({
    query: PREDICTIVE_QUERY,
    variables: { query },
  });
  return data.predictiveSearch ?? { queries: [], products: [], collections: [] };
}
