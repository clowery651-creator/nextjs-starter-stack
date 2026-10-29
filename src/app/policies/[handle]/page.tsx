import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/listing-controls";
import { NotConfigured } from "@/components/not-configured";
import { getPolicy, getShopInfo, isShopifyConfigured } from "@/lib/shopify";

const HANDLES = ["privacy-policy", "refund-policy", "shipping-policy", "terms-of-service"];

/**
 * The handle lookup runs before any Suspense boundary so unknown handles return
 * a real HTTP 404 (not a streamed 200 + noindex). Known handles are prerendered
 * and served from cache, so allowing this segment to block costs ~nothing.
 */
export const instant = false;

export async function generateStaticParams() {
  if (!isShopifyConfigured()) return HANDLES.map((handle) => ({ handle }));
  try {
    const shop = await getShopInfo();
    return shop.policies.length ? shop.policies.map((p) => ({ handle: p.handle })) : HANDLES.map((handle) => ({ handle }));
  } catch {
    return HANDLES.map((handle) => ({ handle }));
  }
}

export async function generateMetadata({ params }: PageProps<"/policies/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured()) return { title: "Policy" };
  try {
    const policy = await getPolicy(handle);
    return policy ? { title: policy.title, alternates: { canonical: `/policies/${handle}` } } : { title: "Not found" };
  } catch {
    return { title: "Policy" };
  }
}

export default async function PolicyPage({ params }: PageProps<"/policies/[handle]">) {
  const { handle } = await params;
  if (!isShopifyConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <NotConfigured />
      </main>
    );
  }
  let policy;
  try {
    policy = await getPolicy(handle);
  } catch (err) {
    console.error("[policy]", err);
    throw new Error("Couldn't load this policy.");
  }
  if (!policy) notFound();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <PageHeading title={policy.title} eyebrow="Policies" />
      <div className="rte" dangerouslySetInnerHTML={{ __html: policy.body ?? "" }} />
    </main>
  );
}
