import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader used only for the Cloudflare Workers build
 * (NEXT_PUBLIC_DEPLOY_TARGET=cloudflare), where Vercel's /_next/image
 * optimizer doesn't exist. Free, no Cloudflare Images needed:
 * - Shopify CDN images are resized/re-encoded by Shopify itself via ?width=
 *   (it serves AVIF/WebP automatically based on the Accept header).
 * - Local /public files are served as-is from Workers Static Assets.
 */
export default function cloudflareImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith("https://cdn.shopify.com/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    if (quality) url.searchParams.set("quality", String(quality));
    return url.toString();
  }
  // Local asset: append the width so srcset candidates stay distinct (ignored by the asset server).
  return src.startsWith("/") ? `${src}${src.includes("?") ? "&" : "?"}w=${width}` : src;
}
