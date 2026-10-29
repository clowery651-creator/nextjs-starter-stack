import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { storefrontFetch } from "./client";
import { PRODUCT_CARD_FRAGMENT } from "./fragments";
import type { ProductCard, ProductDetail } from "./types";

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes { ...ProductCardFields }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const PRODUCT_QUERY = /* GraphQL */ `
  query Product($handle: String!) {
    product(handle: $handle) {
      ...ProductCardFields
      description
      descriptionHtml
      options { name optionValues { name } }
      images(first: 10) { nodes { ...ImageFields } }
      variants(first: 100) {
        nodes {
          id
          title
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

/** Product list, cached for an hour (revalidated in the background). */
export async function getProducts(first = 50): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const data = await storefrontFetch<
    { products: { nodes: ProductCard[] } },
    { first: number }
  >({ query: PRODUCTS_QUERY, variables: { first }, cache: "force-cache" });
  return data.products.nodes;
}

/** Single product by handle, cached for an hour. */
export async function getProduct(handle: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${handle}`);
  const data = await storefrontFetch<
    { product: ProductDetail | null },
    { handle: string }
  >({ query: PRODUCT_QUERY, variables: { handle }, cache: "force-cache" });
  return data.product;
}
