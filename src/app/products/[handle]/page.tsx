import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/add-to-cart";
import { JsonLd } from "@/components/json-ld";
import { NotConfigured } from "@/components/not-configured";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import {
  getProduct,
  getProductRecommendations,
  getProducts,
  isShopifyConfigured,
  type ProductDetail,
} from "@/lib/shopify";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

const PLACEHOLDER = "__placeholder";

/** Pre-render every product at build time; others render on demand. */
/**
 * The handle lookup runs before any Suspense boundary so unknown handles return
 * a real HTTP 404 (not a streamed 200 + noindex). Known handles are prerendered
 * and served from cache, so allowing this segment to block costs ~nothing.
 */
export const instant = false;

export async function generateStaticParams() {
  if (!isShopifyConfigured()) return [{ handle: PLACEHOLDER }];
  try {
    const products = await getProducts(100);
    return products.length ? products.map((p) => ({ handle: p.handle })) : [{ handle: PLACEHOLDER }];
  } catch {
    return [{ handle: PLACEHOLDER }];
  }
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured() || handle === PLACEHOLDER) return { title: "Product" };
  try {
    const product = await getProduct(handle);
    if (!product) return { title: "Product not found", robots: { index: false } };
    const title = product.seo.title || product.title;
    const description = (product.seo.description || product.description || "").slice(0, 160) || undefined;
    const images = (product.images.nodes.length ? product.images.nodes : product.featuredImage ? [product.featuredImage] : [])
      .slice(0, 4)
      .map((img) => ({
        url: img.url,
        width: img.width ?? undefined,
        height: img.height ?? undefined,
        alt: img.altText ?? product.title,
      }));
    return {
      title,
      description,
      alternates: { canonical: `/products/${product.handle}` },
      openGraph: { type: "website", title, description, url: `/products/${product.handle}`, images },
      twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    };
  } catch {
    return { title: "Product" };
  }
}

function productJsonLd(product: ProductDetail) {
  const url = absoluteUrl(`/products/${product.handle}`);
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const availability = (ok: boolean) => (ok ? "https://schema.org/InStock" : "https://schema.org/OutOfStock");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    url,
    image: product.images.nodes.map((i) => i.url).slice(0, 6),
    brand: { "@type": "Brand", name: product.vendor || SITE_NAME },
    ...(product.productType ? { category: product.productType } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: minVariantPrice.currencyCode,
      lowPrice: minVariantPrice.amount,
      highPrice: maxVariantPrice.amount,
      offerCount: product.variants.nodes.length,
      availability: availability(product.availableForSale),
      url,
      offers: product.variants.nodes.slice(0, 50).map((v) => ({
        "@type": "Offer",
        name: v.title,
        ...(v.sku ? { sku: v.sku } : {}),
        price: v.price.amount,
        priceCurrency: v.price.currencyCode,
        availability: availability(v.availableForSale),
        url,
      })),
    },
  };
}

async function Recommendations({ productId }: { productId: string }) {
  let products;
  try {
    products = await getProductRecommendations(productId);
  } catch {
    return null;
  }
  if (!products.length) return null;
  return (
    <section className="mt-20">
      <h2 className="mb-6 font-display text-3xl uppercase">You might also like</h2>
      <ProductGrid products={products} />
    </section>
  );
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  if (!isShopifyConfigured()) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <NotConfigured />
      </main>
    );
  }
  if (handle === PLACEHOLDER) notFound();
  let product: ProductDetail | null;
  try {
    product = await getProduct(handle); // cached ("use cache", tag product:<handle>)
  } catch (err) {
    console.error("[product]", err);
    throw new Error("Couldn't load this product.");
  }
  if (!product) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Shop all", item: absoluteUrl("/products") },
            { "@type": "ListItem", position: 2, name: product.title, item: absoluteUrl(`/products/${product.handle}`) },
          ],
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-wider text-muted">
        <Link href="/products" className="hover:text-fg">
          Shop all
        </Link>
        <span className="mx-2">/</span>
        <span className="text-fg">{product.title}</span>
      </nav>
      <ProductView product={product} />
      <Suspense fallback={<div className="mt-20"><ProductGridSkeleton count={4} /></div>}>
        <Recommendations productId={product.id} />
      </Suspense>
    </main>
  );
}
