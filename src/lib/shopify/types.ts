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

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type Connection<T> = { nodes: T[]; pageInfo: PageInfo };

export type ProductCard = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  compareAtPriceRange: { maxVariantPrice: Money };
};

export type SelectedOption = { name: string; value: string };

export type ProductVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  image: ShopifyImage | null;
};

export type Seo = { title: string | null; description: string | null };

export type ProductDetail = ProductCard & {
  description: string;
  descriptionHtml: string;
  productType: string;
  updatedAt: string;
  seo: Seo;
  options: { name: string; optionValues: { name: string }[] }[];
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ProductVariant[] };
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  updatedAt: string;
  seo: Seo;
  image: ShopifyImage | null;
};

export type CollectionWithProducts = Collection & {
  products: Connection<ProductCard>;
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
    product: { id: string; handle: string; title: string; vendor: string };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: { nodes: CartLine[] };
};

export type NavItem = { title: string; href: string; external: boolean };

export type Policy = { title: string; handle: string; body?: string; url: string };

export type ShopInfo = {
  id: string;
  name: string;
  description: string | null;
  primaryDomainUrl: string;
  policies: Policy[];
};

export type ShopPage = {
  id: string;
  handle: string;
  title: string;
  body: string;
  bodySummary: string;
  updatedAt: string;
  seo: Seo;
};
