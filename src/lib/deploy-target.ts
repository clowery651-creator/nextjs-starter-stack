/**
 * Build-time deploy target. Set NEXT_PUBLIC_DEPLOY_TARGET=cloudflare for the
 * OpenNext / Cloudflare Workers build; unset (default) means Vercel.
 * NEXT_PUBLIC_ vars are inlined at build time, so checks on this are free.
 */
export const DEPLOY_TARGET = process.env.NEXT_PUBLIC_DEPLOY_TARGET?.trim() === "cloudflare" ? "cloudflare" : "vercel";
export const isCloudflare = DEPLOY_TARGET === "cloudflare";
export const isVercel = DEPLOY_TARGET === "vercel";
