import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { storefrontFetch } from "./client";
import {
  COLLECTION_FRAGMENT,
  IMAGE_FRAGMENT,
  PAGE_INFO_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
} from "./fragments";
import { getSort, pageArgs } from "./sort";
import { TAGS } from "./tags";
import type { Collection, CollectionWithProducts, Connection, ProductCard } from "./types";

const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections {
    collections(first: 100, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...CollectionFields
        products(first: 1) { nodes { featuredImage { ...ImageFields } } }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

const COLLECTION_QUERY = /* GraphQL */ `
  query Collection(
    $handle: String!
    $first: Int
    $last: Int
    $after: String
    $before: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      ...CollectionFields
      products(
        first: $first
        last: $last
        after: $after
        before: $before
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes { ...ProductCardFields }
        pageInfo { ...PageInfoFields }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

export type CollectionSummary = Collection & {
  /** Collection image, or the first product's image as a fallback. */
  coverImage: Collection["image"];
};

/** All collections (excluding empty ones). Cached; tag "collections". */
export async function getCollections(): Promise<CollectionSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections);
  const data = await storefrontFetch<{
    collections: {
      nodes: (Collection & {
        products: { nodes: { featuredImage: Collection["image"] }[] };
      })[];
    };
  }>({ query: COLLECTIONS_QUERY });
  return data.collections.nodes
    .filter((c) => c.products.nodes.length > 0)
    .map(({ products, ...c }) => ({
      ...c,
      coverImage: c.image ?? products.nodes[0]?.featuredImage ?? null,
    }));
}

/** One collection with a sorted, paginated page of products. */
export async function getCollection(
  handle: string,
  { sort, after, before }: { sort?: string; after?: string; before?: string } = {},
): Promise<CollectionWithProducts | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections, TAGS.collection(handle), TAGS.products);
  const s = getSort(sort);
  const data = await storefrontFetch<{ collection: CollectionWithProducts | null }>({
    query: COLLECTION_QUERY,
    variables: {
      handle,
      ...pageArgs(after, before),
      sortKey: s.collectionKey,
      reverse: s.reverse,
    },
  });
  return data.collection;
}

/** First few products of a collection (homepage feature). */
export async function getCollectionProducts(
  handle: string,
  first = 8,
): Promise<{ collection: Collection; products: ProductCard[] } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.collections, TAGS.collection(handle), TAGS.products);
  const data = await storefrontFetch<{
    collection: (Collection & { products: Connection<ProductCard> }) | null;
  }>({
    query: COLLECTION_QUERY,
    variables: { handle, first, sortKey: "COLLECTION_DEFAULT", reverse: false },
  });
  if (!data.collection) return null;
  const { products, ...collection } = data.collection;
  return { collection, products: products.nodes };
}
