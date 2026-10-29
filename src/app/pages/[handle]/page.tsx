import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/listing-controls";
import { NotConfigured } from "@/components/not-configured";
import { getPage, isShopifyConfigured } from "@/lib/shopify";

/** Shopify Online Store pages (e.g. /pages/contact) rendered from the Storefront API. */
/**
 * The handle lookup runs before any Suspense boundary so unknown handles return
 * a real HTTP 404 (not a streamed 200 + noindex). Known handles are prerendered
 * and served from cache, so allowing this segment to block costs ~nothing.
 */
export const instant = false;

export async function generateStaticParams() {
  return [{ handle: "contact" }];
}

export async function generateMetadata({ params }: PageProps<"/pages/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured()) return { title: "Page" };
  try {
    const page = await getPage(handle);
    if (!page) return { title: "Not found" };
    return {
      title: page.seo.title || page.title,
      description: (page.seo.description || page.bodySummary || "").slice(0, 160) || undefined,
      alternates: { canonical: `/pages/${handle}` },
    };
  } catch {
    return { title: "Page" };
  }
}

export default async function ShopPage({ params }: PageProps<"/pages/[handle]">) {
  const { handle } = await params;
  if (!isShopifyConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <NotConfigured />
      </main>
    );
  }
  let page;
  try {
    page = await getPage(handle);
  } catch (err) {
    console.error("[page]", err);
    throw new Error("Couldn't load this page.");
  }
  if (!page) notFound();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <PageHeading title={page.title} />
      <div className="rte" dangerouslySetInnerHTML={{ __html: page.body }} />
    </main>
  );
}
