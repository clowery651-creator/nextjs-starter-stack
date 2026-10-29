"use client";

import { ShopifyProvider } from "@shopify/hydrogen-react";
import type { ReactNode } from "react";

export type PublicShopConfig = {
  storeDomain: string;
  storefrontToken: string;
  storefrontApiVersion: string;
} | null;

/**
 * Wraps the app in Hydrogen React's ShopifyProvider (locale + store config
 * for <Money/>, useShop(), etc.). The token here is the PUBLIC Storefront
 * token, which is designed to be exposed to browsers. If Shopify isn't
 * configured we render children as-is (Hydrogen React falls back to en-US).
 */
export function Providers({
  shop,
  children,
}: {
  shop: PublicShopConfig;
  children: ReactNode;
}) {
  if (!shop) return <>{children}</>;
  return (
    <ShopifyProvider
      storeDomain={shop.storeDomain}
      storefrontToken={shop.storefrontToken}
      storefrontApiVersion={shop.storefrontApiVersion}
      countryIsoCode="US"
      languageIsoCode="EN"
    >
      {children}
    </ShopifyProvider>
  );
}
