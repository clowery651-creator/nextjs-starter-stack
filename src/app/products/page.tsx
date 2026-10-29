import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import {
  formatMoney,
  getProducts,
  isShopifyConfigured,
  type Product,
} from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Products",
  description: "Products from the Shopify Storefront API",
};

type ProductsResult =
  | { status: "ok"; products: Product[] }
  | { status: "not-configured" }
  | { status: "error"; message: string };

async function loadProducts(): Promise<ProductsResult> {
  "use cache";
  cacheLife("hours");
  if (!isShopifyConfigured()) return { status: "not-configured" };
  try {
    return { status: "ok", products: await getProducts(24) };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function ProductList() {
  const result = await loadProducts();

  if (result.status === "not-configured") {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        <p className="font-medium">Shopify isn&apos;t connected yet.</p>
        <p className="mt-1 text-sm">
          Copy <code>.env.example</code> to <code>.env.local</code> and set{" "}
          <code>SHOPIFY_STORE_DOMAIN</code> and{" "}
          <code>SHOPIFY_STOREFRONT_ACCESS_TOKEN</code>.
        </p>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
        <p className="font-medium">Couldn&apos;t load products.</p>
        <p className="mt-1 text-sm">{result.message}</p>
      </div>
    );
  }

  if (result.products.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">No products found.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {result.products.map((p) => (
        <li
          key={p.id}
          className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
        >
          {p.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.featuredImage.url}
              alt={p.featuredImage.altText ?? p.title}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900" />
          )}
          <div className="p-4">
            <h2 className="font-medium">{p.title}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {formatMoney(p.priceRange.minVariantPrice)}
            </p>
            {p.onlineStoreUrl ? (
              <a
                href={p.onlineStoreUrl}
                className="mt-2 inline-block text-sm font-medium underline"
              >
                View in store
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Products</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading products…</p>}>
        <ProductList />
      </Suspense>
    </main>
  );
}
