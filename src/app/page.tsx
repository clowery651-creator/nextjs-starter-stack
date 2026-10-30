import NextImage from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import { CollectionCard, CollectionGridSkeleton } from "@/components/sections/collection-card";
import { NotConfigured } from "@/components/not-configured";
import { getCollections, getProducts, isShopifyConfigured } from "@/lib/shopify";
import { SITE_NAME, SOCIAL_LINKS, absoluteUrl, getSiteUrl } from "@/lib/site";

async function FeaturedCollections() {
  if (!isShopifyConfigured()) return <NotConfigured />;
  let collections;
  try {
    collections = await getCollections();
  } catch (err) {
    console.error("[home] collections", err);
    return null;
  }
  if (!collections.length) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.slice(0, 3).map((c, i) => (
        <li key={c.id}>
          <CollectionCard collection={c} priority={i === 0} />
        </li>
      ))}
    </ul>
  );
}

async function LatestProducts() {
  if (!isShopifyConfigured()) return null;
  let products;
  try {
    products = await getProducts(8);
  } catch (err) {
    console.error("[home] products", err);
    return <p className="text-muted">Products are unavailable right now. Please try again shortly.</p>;
  }
  return <ProductGrid products={products} />;
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-display text-3xl uppercase sm:text-4xl">{title}</h2>
      <Link href={href} className="text-sm font-semibold uppercase tracking-wider text-glitch-soft hover:text-fg">
        {cta} →
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: getSiteUrl(),
          logo: absoluteUrl("/brand/mark.png"),
          sameAs: SOCIAL_LINKS.map((s) => s.href),
        }}
      />
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgb(124_58_237/0.35),transparent_60%),radial-gradient(ellipse_at_10%_90%,rgb(34_211_238/0.12),transparent_50%)]"
        />
        <div aria-hidden className="scanlines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.3fr_1fr] md:py-24">
          <div className="flex flex-col items-start gap-6">
            <p className="border border-glitch/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-glitch-soft">
              Apparel · Music · Events
            </p>
            <h1 className="font-display text-6xl uppercase leading-[0.9] sm:text-7xl lg:text-8xl">
              <span className="glitch" data-text="Twisted">
                Twisted
              </span>
              <br />
              <span className="glitch text-glitch-soft" data-text="Reality">
                Reality
              </span>
              <span className="ml-3 align-top text-2xl text-muted sm:text-3xl">E.N.T.</span>
            </h1>
            <p className="max-w-md text-lg text-muted">
              Streetwear, sound and nights out from {SITE_NAME}. Browse the latest drops and pick your piece.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="bg-glitch px-7 py-3.5 font-display text-xl uppercase tracking-wider text-white transition-colors hover:bg-glitch-strong"
              >
                Shop now
              </Link>
              <Link
                href="/collections"
                className="border border-line px-7 py-3.5 font-display text-xl uppercase tracking-wider hover:border-fg"
              >
                Collections
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <NextImage
              src="/brand/mark.png"
              alt="Twisted Reality glitch mark"
              width={384}
              height={384}
              loading="eager"
              fetchPriority="high"
              className="h-auto w-full drop-shadow-[0_0_60px_rgb(124_58_237/0.45)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeader title="Collections" href="/collections" cta="All collections" />
        <Suspense fallback={<CollectionGridSkeleton />}>
          <FeaturedCollections />
        </Suspense>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
        <SectionHeader title="Latest drops" href="/products" cta="Shop all" />
        <Suspense fallback={<ProductGridSkeleton />}>
          <LatestProducts />
        </Suspense>
      </section>

      <section className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6">
        <div className="scanlines relative flex flex-col items-start gap-5 overflow-hidden border border-glitch/50 bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="font-display text-4xl uppercase sm:text-5xl">
              <span className="glitch" data-text="Break the pattern">
                Break the pattern
              </span>
            </h2>
            <p className="mt-2 text-muted">See what just dropped.</p>
          </div>
          <Link
            href="/products"
            className="bg-glitch px-7 py-3.5 font-display text-xl uppercase tracking-wider text-white hover:bg-glitch-strong"
          >
            Enter the shop
          </Link>
        </div>
      </section>
    </main>
  );
}
