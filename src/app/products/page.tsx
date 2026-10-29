import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { PageHeading, Pagination, SortLinks } from "@/components/listing-controls";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import { getProductPage, isShopifyConfigured } from "@/lib/shopify";
import { getSort, SORT_OPTIONS } from "@/lib/shopify/sort";
import { param } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Shop every piece from Twisted Reality E.N.T.",
  alternates: { canonical: "/products" },
};

async function Listing({ searchParams }: { searchParams: PageProps<"/products">["searchParams"] }) {
  const sp = await searchParams;
  const sort = getSort(param(sp, "sort"));
  const after = param(sp, "after");
  const before = param(sp, "before");
  if (!isShopifyConfigured()) return <NotConfigured />;
  let page;
  try {
    page = await getProductPage({ sort: sort.slug, after, before });
  } catch (err) {
    console.error("[products]", err);
    return <ErrorBox title="Couldn't load products." message="Please try again in a moment." />;
  }
  const keep = { sort: sort.slug === "featured" ? undefined : sort.slug };
  return (
    <>
      <div className="mb-6">
        <SortLinks basePath="/products" current={sort} options={SORT_OPTIONS.filter((o) => o.slug !== "featured")} />
      </div>
      {page.nodes.length ? (
        <ProductGrid products={page.nodes} priorityCount={4} />
      ) : (
        <p className="text-muted">No products found.</p>
      )}
      <Pagination basePath="/products" pageInfo={page.pageInfo} params={keep} />
    </>
  );
}

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <PageHeading title="Shop all" eyebrow="Catalog" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <Listing searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
