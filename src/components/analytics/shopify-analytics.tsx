"use client";

import { AnalyticsPageType, useShopifyCookies } from "@shopify/hydrogen-react";
import type { CurrencyCode } from "@shopify/hydrogen-react/storefront-api-types";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getConsent, setConsent, subscribeConsent, type Consent } from "./consent";
import { configureShopifyAnalytics, trackPageView } from "./shopify-events";

function pageTypeFor(pathname: string): string {
  if (pathname === "/") return AnalyticsPageType.home;
  if (pathname.startsWith("/products/")) return AnalyticsPageType.product;
  if (pathname === "/collections") return AnalyticsPageType.listCollections;
  if (pathname === "/products" || pathname.startsWith("/collections/")) return AnalyticsPageType.collection;
  if (pathname.startsWith("/search")) return AnalyticsPageType.search;
  if (pathname.startsWith("/cart")) return AnalyticsPageType.cart;
  if (pathname.startsWith("/policies/")) return AnalyticsPageType.policy;
  return AnalyticsPageType.page;
}

function useConsent(): Consent {
  return useSyncExternalStore<Consent>(subscribeConsent, getConsent, () => "unset");
}

/**
 * Shopify analytics (Hydrogen React `sendShopifyAnalytics`): PAGE_VIEW on
 * every client navigation and ADD_TO_CART from the cart provider. Nothing is
 * sent until the visitor accepts the banner; GPC is honored.
 */
export function ShopifyAnalytics({
  shopId,
  currency = "USD",
}: {
  shopId: string;
  currency?: CurrencyCode;
}) {
  const pathname = usePathname();
  const consent = useConsent();

  // Keep Shopify's cookie helper in its no-network mode. The same-origin
  // consent proxy it can call (/api/unstable/graphql.json) only exists on
  // Shopify-hosted/Oxygen domains, so fetching tracking values here would
  // just 404. See README → Analytics.
  useShopifyCookies({ fetchTrackingValues: false });

  useEffect(() => {
    configureShopifyAnalytics({ shopId, currency });
    return () => configureShopifyAnalytics(null);
  }, [shopId, currency]);

  useEffect(() => {
    if (consent !== "granted") return;
    // Let the new page set document.title first.
    const t = window.setTimeout(() => trackPageView(pageTypeFor(pathname)), 50);
    return () => window.clearTimeout(t);
  }, [pathname, consent]);

  if (consent !== "unset") return null;
  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl flex-col gap-3 border border-line bg-surface/95 p-4 text-sm shadow-2xl backdrop-blur sm:flex-row sm:items-center"
    >
      <p className="flex-1 text-muted">
        We&apos;d like to use Shopify analytics cookies to understand how the store is used.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="border border-line px-3 py-1.5 font-medium hover:border-fg"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="bg-glitch px-3 py-1.5 font-medium text-white hover:bg-glitch-strong"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
