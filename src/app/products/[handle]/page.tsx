import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VariantSelector } from "@/components/add-to-cart";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { getProduct, getProducts, isShopifyConfigured } from "@/lib/shopify";

/** Pre-render every product at build time; others render on demand. */
export async function generateStaticParams() {
  if (!isShopifyConfigured()) return [{ handle: "__placeholder" }];
  try {
    const products = await getProducts(50);
    return products.length
      ? products.map((p) => ({ handle: p.handle }))
      : [{ handle: "__placeholder" }];
  } catch {
    return [{ handle: "__placeholder" }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured()) return { title: "Product" };
  try {
    const product = await getProduct(handle);
    return product
      ? { title: product.title, description: product.description.slice(0, 160) }
      : { title: "Product not found" };
  } catch {
    return { title: "Product" };
  }
}

async function ProductView({ handle }: { handle: string }) {
  if (!isShopifyConfigured()) return <NotConfigured />;
  let product;
  try {
    product = await getProduct(handle);
  } catch (err) {
    return (
      <ErrorBox
        title="Couldn't load this product."
        message={err instanceof Error ? err.message : "Unknown error"}
      />
    );
  }
  if (!product) notFound();
  return <VariantSelector product={product} />;
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <Link href="/products" className="mb-6 inline-block text-sm underline">
        ← All products
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Loading product…</p>}>
        <ProductView handle={handle} />
      </Suspense>
    </main>
  );
}
