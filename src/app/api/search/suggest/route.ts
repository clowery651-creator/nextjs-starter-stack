import type { NextRequest } from "next/server";
import { isShopifyConfigured, predictiveSearch } from "@/lib/shopify";

const EMPTY = { queries: [], products: [], collections: [] };

/** GET /api/search/suggest?q= → Storefront predictiveSearch (header type-ahead). */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2 || !isShopifyConfigured()) return Response.json(EMPTY);
  try {
    const result = await predictiveSearch(q);
    return Response.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[suggest]", err);
    return Response.json(EMPTY, { status: 502 });
  }
}
