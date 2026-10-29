"use client";

import {
  AnalyticsEventName,
  ShopifySalesChannel,
  getClientBrowserParameters,
  sendShopifyAnalytics,
  type ShopifyAnalyticsProduct,
} from "@shopify/hydrogen-react";
import type { CurrencyCode } from "@shopify/hydrogen-react/storefront-api-types";
import type { Cart, Money } from "@/lib/shopify/types";
import { getConsent } from "./consent";

/** Set once by <ShopifyAnalytics/> when the shop id is known. */
let config: { shopId: string; currency: CurrencyCode } | null = null;

export function configureShopifyAnalytics(c: typeof config) {
  config = c;
}

function base() {
  if (!config || getConsent() !== "granted") return null;
  return {
    hasUserConsent: true,
    analyticsAllowed: true,
    marketingAllowed: false,
    saleOfDataAllowed: false,
    shopId: config.shopId,
    currency: config.currency,
    shopifySalesChannel: ShopifySalesChannel.headless,
    acceptedLanguage: "EN" as const,
  };
}

function swallow(p: Promise<void>) {
  p.catch(() => {
    /* analytics must never break the storefront */
  });
}

export function trackPageView(pageType: string) {
  const b = base();
  if (!b) return;
  swallow(
    sendShopifyAnalytics({
      eventName: AnalyticsEventName.PAGE_VIEW,
      payload: { ...b, ...getClientBrowserParameters(), pageType },
    }),
  );
}

export function trackAddToCart(
  cart: Cart,
  item: {
    merchandiseId: string;
    quantity?: number;
    title: string;
    price: Money;
    product: { id: string; title: string; vendor: string };
  },
) {
  const b = base();
  if (!b) return;
  const product: ShopifyAnalyticsProduct = {
    productGid: item.product.id,
    variantGid: item.merchandiseId,
    name: item.product.title,
    variantName: item.title,
    brand: item.product.vendor,
    price: item.price.amount,
    quantity: item.quantity ?? 1,
  };
  swallow(
    sendShopifyAnalytics({
      eventName: AnalyticsEventName.ADD_TO_CART,
      payload: {
        ...b,
        ...getClientBrowserParameters(),
        cartId: cart.id,
        products: [product],
        totalValue: Number(item.price.amount) * (item.quantity ?? 1),
      },
    }),
  );
}
