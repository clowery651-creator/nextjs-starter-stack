import type { Metadata } from "next";
import { Suspense } from "react";
import { CartView } from "@/components/cart/cart-view";
import { CartLinesSkeleton } from "@/components/cart/cart-lines";
import { PageHeading } from "@/components/listing-controls";
import { NotConfigured } from "@/components/not-configured";
import { isShopifyConfigured } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <PageHeading title="Cart" />
      {isShopifyConfigured() ? (
        <Suspense fallback={<CartLinesSkeleton rows={3} />}>
          <CartView />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </main>
  );
}
