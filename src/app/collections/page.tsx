import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading } from "@/components/listing-controls";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { CollectionCard, CollectionGridSkeleton } from "@/components/sections/collection-card";
import { getCollections, isShopifyConfigured } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse every Twisted Reality E.N.T. collection.",
  alternates: { canonical: "/collections" },
};

async function CollectionList() {
  if (!isShopifyConfigured()) return <NotConfigured />;
  let collections;
  try {
    collections = await getCollections();
  } catch (err) {
    console.error("[collections]", err);
    return <ErrorBox title="Couldn't load collections." message="Please try again in a moment." />;
  }
  if (!collections.length) return <p className="text-muted">No collections yet.</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((c, i) => (
        <li key={c.id}>
          <CollectionCard collection={c} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}

export default function CollectionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
      <PageHeading title="Collections" eyebrow="Browse" />
      <Suspense fallback={<CollectionGridSkeleton count={6} />}>
        <CollectionList />
      </Suspense>
    </main>
  );
}
