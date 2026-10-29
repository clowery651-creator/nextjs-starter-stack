import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading, Pagination, SortLinks } from "@/components/listing-controls";
import { SearchBox } from "@/components/layout/search-box";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import { isShopifyConfigured, searchProducts } from "@/lib/shopify";
import { SORT_OPTIONS, getSort } from "@/lib/shopify/sort";
import { param } from "@/lib/search-params";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = param(await searchParams, "q")?.trim();
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

const SEARCH_SORTS = SORT_OPTIONS.filter((o) => ["featured", "price-asc", "price-desc"].includes(o.slug)).map((o) =>
  o.slug === "featured" ? { ...o, label: "Relevance" } : o,
);

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = param(sp, "q")?.trim() ?? "";
  const sort = getSort(param(sp, "sort"));
  if (!isShopifyConfigured()) return <NotConfigured />;
  if (!q) return <p className="text-muted">Type something to search the shop.</p>;
  let result;
  try {
    result = await searchProducts(q, { sort: sort.slug, after: param(sp, "after"), before: param(sp, "before") });
  } catch (err) {
    console.error("[search]", err);
    return <ErrorBox title="Search is unavailable right now." message="Please try again in a moment." />;
  }
  const keep = { q, sort: sort.slug === "featured" ? undefined : sort.slug };
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted" role="status">
          {result.totalCount} {result.totalCount === 1 ? "result" : "results"} for “{q}”
        </p>
        <SortLinks basePath="/search" current={sort} extra={{ q }} options={SEARCH_SORTS} />
      </div>
      {result.nodes.length ? (
        <ProductGrid products={result.nodes} priorityCount={4} />
      ) : (
        <p className="text-muted">No products match “{q}”. Try a different word.</p>
      )}
      <Pagination basePath="/search" pageInfo={result.pageInfo} params={keep} />
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <PageHeading title="Search" eyebrow="Find your piece">
        <Suspense fallback={<div className="h-9 w-full max-w-md border border-line" />}>
          <SearchBox className="max-w-md" />
        </Suspense>
      </PageHeading>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
