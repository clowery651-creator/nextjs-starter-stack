export const IMAGE_FRAGMENT = /* GraphQL */ `
  fragment ImageFields on Image { id url altText width height }
`;

export const PRODUCT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProductCardFields on Product {
    id
    handle
    title
    availableForSale
    featuredImage { ...ImageFields }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount { amount currencyCode }
          amountPerQuantity { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            image { ...ImageFields }
            selectedOptions { name value }
            product { handle title }
          }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;
