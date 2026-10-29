import type {
  CurrencyCode,
  CartLineUpdateInput,
} from "@shopify/hydrogen-react/storefront-api-types";

export type { CartLineUpdateInput };

export type Money = { amount: string; currencyCode: CurrencyCode };

export type ShopifyImage = {
  id?: string | null;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ProductCard = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
};

export type SelectedOption = { name: string; value: string };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  image: ShopifyImage | null;
};

export type ProductDetail = ProductCard & {
  description: string;
  descriptionHtml: string;
  options: { name: string; optionValues: { name: string }[] }[];
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ProductVariant[] };
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money; amountPerQuantity: Money };
  merchandise: {
    id: string;
    title: string;
    image: ShopifyImage | null;
    selectedOptions: SelectedOption[];
    product: { handle: string; title: string };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: { nodes: CartLine[] };
};
