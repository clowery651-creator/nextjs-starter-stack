import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { TAGS } from "@/lib/shopify/tags";

/**
 * POST /api/revalidate — on-demand cache invalidation for Shopify webhooks.
 *
 * Auth (either):
 *  - Shopify webhook HMAC: `X-Shopify-Hmac-Sha256` verified with
 *    SHOPIFY_REVALIDATION_SECRET (the webhook signing secret), or
 *  - `?secret=<SHOPIFY_REVALIDATION_SECRET>` / `x-revalidation-secret` header
 *    (manual calls, other services).
 *
 * Topic comes from `X-Shopify-Topic` (products/*, collections/*, …) or `?topic=`.
 */

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function tagsFor(topic: string, handle?: string): string[] {
  const [resource] = topic.split("/");
  switch (resource) {
    case "products":
    case "inventory_levels":
    case "inventory_items":
      return [TAGS.products, ...(handle ? [TAGS.product(handle)] : [])];
    case "collections":
      // Collection changes can change membership/ordering of product lists.
      return [TAGS.collections, ...(handle ? [TAGS.collection(handle)] : []), TAGS.products];
    case "menus":
    case "navigation":
      return [TAGS.menu];
    case "shop":
    case "policies":
      return [TAGS.shop];
    case "all":
      return [TAGS.products, TAGS.collections, TAGS.menu, TAGS.shop];
    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.SHOPIFY_REVALIDATION_SECRET?.trim();
  if (!secret) {
    return Response.json({ revalidated: false, message: "SHOPIFY_REVALIDATION_SECRET is not set" }, { status: 500 });
  }

  const raw = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");
  const provided = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-revalidation-secret");

  let authorized = false;
  if (hmac) {
    const digest = createHmac("sha256", secret).update(raw, "utf8").digest("base64");
    authorized = safeEqual(digest, hmac);
  } else if (provided) {
    authorized = safeEqual(provided, secret);
  }
  if (!authorized) {
    return Response.json({ revalidated: false, message: "Unauthorized" }, { status: 401 });
  }

  const topic = (request.headers.get("x-shopify-topic") ?? request.nextUrl.searchParams.get("topic") ?? "all").toLowerCase();
  let handle: string | undefined;
  try {
    const body = raw ? (JSON.parse(raw) as { handle?: unknown }) : {};
    if (typeof body.handle === "string") handle = body.handle;
  } catch {
    // non-JSON body is fine for manual calls
  }
  handle ??= request.nextUrl.searchParams.get("handle") ?? undefined;

  const tags = tagsFor(topic, handle);
  if (!tags.length) {
    // Acknowledge so Shopify doesn't retry topics we don't cache.
    return Response.json({ revalidated: false, topic, message: "Topic ignored" });
  }
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, topic, tags, now: Date.now() });
}

export function GET() {
  return Response.json({ message: "POST Shopify webhooks here." }, { status: 405, headers: { Allow: "POST" } });
}
