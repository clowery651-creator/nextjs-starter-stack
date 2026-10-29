"use client";

import { ShopifyProvider } from "@shopify/hydrogen-react";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/cart-context";
import type { Cart } from "@/lib/shopify/types";

export type PublicShopConfig = {
  storeDomain: string;
  storefrontToken: string;
  storefrontApiVersion: string;
} | null;

/**
 * Hydrogen React's ShopifyProvider (locale + store config for <Money/>,
 * useShop(), etc.) and the optimistic cart. The token here is the PUBLIC
 * Storefront token, which is designed to be exposed to browsers.
 */
export function Providers({
  shop,
  cartPromise,
  children,
}: {
  shop: PublicShopConfig;
  cartPromise: Promise<Cart | null>;
  children: ReactNode;
}) {
  const inner = <CartProvider cartPromise={cartPromise}>{children}</CartProvider>;
  if (!shop) return inner;
  return (
    <ShopifyProvider
      storeDomain={shop.storeDomain}
      storefrontToken={shop.storefrontToken}
      storefrontApiVersion={shop.storefrontApiVersion}
      countryIsoCode="US"
      languageIsoCode="EN"
    >
      {inner}
    </ShopifyProvider>
  );
}
