import type { MetadataRoute } from "next";
import { absoluteUrl, isWorkersDevTestCopy } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Cloudflare workers.dev test copy: block everything, no sitemap.
  if (isWorkersDevTestCopy()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  // Keep preview deployments out of search results.
  const isPreview = process.env.VERCEL_ENV === "preview";
  return {
    rules: isPreview
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/", disallow: ["/api/", "/cart", "/account", "/search"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
