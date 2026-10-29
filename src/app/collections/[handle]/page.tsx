import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeading, Pagination, SortLinks } from "@/components/listing-controls";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import { getCollection, getCollections, isShopifyConfigured, type CollectionWithProducts } from "@/lib/shopify";
import { getSort } from "@/lib/shopify/sort";
import { param } from "@/lib/search-params";
import { absoluteUrl } from "@/lib/site";

const PLACEHOLDER = "__placeholder";

/** Pre-render known collections; others render on demand. */
/**
 * The handle lookup runs before any Suspense boundary so unknown handles return
 * a real HTTP 404 (not a streamed 200 + noindex). Known handles are prerendered
 * and served from cache, so allowing this segment to block costs ~nothing.
 */
export const instant = false;

export async function generateStaticParams() {
  if (!isShopifyConfigured()) return [{ handle: PLACEHOLDER }];
  try {
    const collections = await getCollections();
    return collections.length ? collections.map((c) => ({ handle: c.handle })) : [{ handle: PLACEHOLDER }];
  } catch {
    return [{ handle: PLACEHOLDER }];
  }
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured() || handle === PLACEHOLDER) return { title: "Collection" };
  try {
    const c = await getCollection(handle);
    if (!c) return { title: "Collection not found", robots: { index: false } };
    const title = c.seo.title || c.title;
    const description = (c.seo.description || c.description || "").slice(0, 160) || undefined;
    const image = c.image ?? c.products.nodes[0]?.featuredImage ?? null;
    const images = image
      ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.altText ?? c.title }]
      : undefined;
    return {
      title,
      description,
      alternates: { canonical: `/collections/${c.handle}` },
      openGraph: { title, description, url: `/collections/${c.handle}`, images },
      twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
    };
  } catch {
    return { title: "Collection" };
  }
}

function Heading({ c }: { c: CollectionWithProducts }) {
  return (
    <PageHeading title={c.title} eyebrow="Collection">
      {c.description ? <p className="max-w-2xl text-muted">{c.description}</p> : null}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Collections", item: absoluteUrl("/collections") },
            { "@type": "ListItem", position: 2, name: c.title, item: absoluteUrl(`/collections/${c.handle}`) },
          ],
        }}
      />
    </PageHeading>
  );
}

async function Products({
  handle,
  searchParams,
}: {
  handle: string;
  searchParams: PageProps<"/collections/[handle]">["searchParams"];
}) {
  const sp = await searchParams;
  const sort = getSort(param(sp, "sort"));
  if (!isShopifyConfigured()) return <NotConfigured />;
  if (handle === PLACEHOLDER) notFound();
  let c;
  try {
    c = await getCollection(handle, { sort: sort.slug, after: param(sp, "after"), before: param(sp, "before") });
  } catch (err) {
    console.error("[collection products]", err);
    return <ErrorBox title="Couldn't load this collection." message="Please try again in a moment." />;
  }
  if (!c) notFound();
  const base = `/collections/${c.handle}`;
  return (
    <>
      <div className="mb-6">
        <SortLinks basePath={base} current={sort} />
      </div>
      {c.products.nodes.length ? (
        <ProductGrid products={c.products.nodes} priorityCount={4} />
      ) : (
        <p className="text-muted">
          Nothing here yet. <Link href="/products" className="underline">Shop all</Link>.
        </p>
      )}
      <Pagination
        basePath={base}
        pageInfo={c.products.pageInfo}
        params={{ sort: sort.slug === "featured" ? undefined : sort.slug }}
      />
    </>
  );
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  if (!isShopifyConfigured()) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <PageHeading title="Collection" />
        <NotConfigured />
      </main>
    );
  }
  if (handle === PLACEHOLDER) notFound();
  // Cached lookup outside <Suspense> so a missing collection returns a real 404.
  let collection: CollectionWithProducts | null;
  try {
    collection = await getCollection(handle);
  } catch (err) {
    console.error("[collection]", err);
    throw new Error("Couldn't load this collection.");
  }
  if (!collection) notFound();
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs uppercase tracking-wider text-muted">
        <Link href="/collections" className="hover:text-fg">
          Collections
        </Link>
      </nav>
      <Heading c={collection} />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Products handle={handle} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
