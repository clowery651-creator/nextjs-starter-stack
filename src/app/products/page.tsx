import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Image, Money } from "@/components/hydrogen";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { getProducts, isShopifyConfigured, type ProductCard } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Products",
  description: "Products from the Shopify Storefront API",
};

async function ProductList() {
  if (!isShopifyConfigured()) return <NotConfigured />;

  let products: ProductCard[];
  try {
    products = await getProducts(50); // cached for an hour (see lib/shopify/products.ts)
  } catch (err) {
    return (
      <ErrorBox
        title="Couldn't load products."
        message={err instanceof Error ? err.message : "Unknown error"}
      />
    );
  }

  if (products.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">No products found.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const { minVariantPrice, maxVariantPrice } = p.priceRange;
        const hasRange = minVariantPrice.amount !== maxVariantPrice.amount;
        return (
          <li
            key={p.id}
            data-testid="product-card"
            className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <Link href={`/products/${p.handle}`} className="block">
              {p.featuredImage ? (
                <Image
                  data={p.featuredImage}
                  alt={p.featuredImage.altText ?? p.title}
                  aspectRatio="1/1"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900" />
              )}
              <div className="p-4">
                <h2 className="font-medium">{p.title}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {hasRange ? "From " : null}
                  <Money data={minVariantPrice} as="span" />
                  {p.availableForSale ? null : " · Sold out"}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
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
