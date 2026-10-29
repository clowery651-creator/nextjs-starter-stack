import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { storefrontFetch } from "./client";
import { PAGE_INFO_FRAGMENT, PRODUCT_CARD_FRAGMENT } from "./fragments";
import { getSort, pageArgs } from "./sort";
import { TAGS } from "./tags";
import type { Connection, ProductCard, ProductDetail } from "./types";

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products(
    $first: Int
    $last: Int
    $after: String
    $before: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
  ) {
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
  ${PRODUCT_CARD_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

const PRODUCT_QUERY = /* GraphQL */ `
  query Product($handle: String!) {
    product(handle: $handle) {
      ...ProductCardFields
      description
      descriptionHtml
      productType
      updatedAt
      seo { title description }
      options { name optionValues { name } }
      images(first: 10) { nodes { ...ImageFields } }
      variants(first: 100) {
        nodes {
          id
          title
          sku
          availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { ...ImageFields }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query Recommendations($productId: ID!) {
    productRecommendations(productId: $productId, intent: RELATED) {
      ...ProductCardFields
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const HANDLES_QUERY = /* GraphQL */ `
  query ProductHandles($after: String) {
    products(first: 250, after: $after) {
      nodes { handle updatedAt }
      pageInfo { hasNextPage endCursor }
    }
  }
`;


/** First N products (newest updates first). Cached; tag "products". */
export async function getProducts(first = 50): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);
  const data = await storefrontFetch<{ products: Connection<ProductCard> }>({
    query: PRODUCTS_QUERY,
    variables: { first, sortKey: "UPDATED_AT", reverse: true },
  });
  return data.products.nodes;
}

/** Sorted, cursor-paginated product list for /products. */
export async function getProductPage({
  sort,
  after,
  before,
}: {
  sort?: string;
  after?: string;
  before?: string;
}): Promise<Connection<ProductCard>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);
  const s = getSort(sort);
  const data = await storefrontFetch<{ products: Connection<ProductCard> }>({
    query: PRODUCTS_QUERY,
    variables: {
      ...pageArgs(after, before),
      sortKey: s.productKey,
      reverse: s.reverse,
    },
  });
  return data.products;
}

/** Single product by handle. Cached; tags "products" + "product:<handle>". */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products, TAGS.product(handle));
  const data = await storefrontFetch<{ product: ProductDetail | null }>({
    query: PRODUCT_QUERY,
    variables: { handle },
  });
  return data.product;
}

export async function getProductRecommendations(productId: string): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);
  const data = await storefrontFetch<{ productRecommendations: ProductCard[] | null }>({
    query: RECOMMENDATIONS_QUERY,
    variables: { productId },
  });
  return (data.productRecommendations ?? []).slice(0, 4);
}

/** Every product handle (for sitemap + static params). */
export async function getAllProductHandles(): Promise<{ handle: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.products);
  const out: { handle: string; updatedAt: string }[] = [];
  let after: string | null = null;
  for (let i = 0; i < 20; i++) {
    const data: {
      products: {
        nodes: { handle: string; updatedAt: string }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await storefrontFetch({ query: HANDLES_QUERY, variables: { after } });
    out.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return out;
}
