import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { isVercel } from "@/lib/deploy-target";
import type { Metadata, Viewport } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ShopifyAnalytics } from "@/components/analytics/shopify-analytics";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";
import { getCart, getShopInfo, getShopifyConfig, type Cart } from "@/lib/shopify";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl, isWorkersDevTestCopy } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${SITE_NAME} — Apparel, Music & Events`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: isWorkersDevTestCopy() ? { index: false, follow: false } : { index: true, follow: true },
  // Search console ownership tokens; set in Vercel env, no code change needed.
  verification: siteVerification(),
};

function siteVerification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#07060a",
  colorScheme: "dark",
};

/** Shop id for Shopify analytics; renders nothing if Shopify is unavailable. */
async function ShopifyAnalyticsLoader() {
  if (!getShopifyConfig()) return null;
  const shopId = await getShopInfo()
    .then((s) => s.id)
    .catch(() => null);
  return shopId ? <ShopifyAnalytics shopId={shopId} currency="USD" /> : null;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const config = getShopifyConfig();
  // Only PUBLIC values go to the client (the Storefront public token is
  // designed to be browser-visible).
  const shop = config
    ? {
        storeDomain: config.storeDomain,
        storefrontToken: config.publicStorefrontToken,
        storefrontApiVersion: config.storefrontApiVersion,
      }
    : null;
  // Not awaited: the cart streams in where it's used (inside <Suspense>),
  // so the static shell isn't blocked on cookies.
  const cartPromise: Promise<Cart | null> = config
    ? getCart().catch((err: unknown) => {
        // Prerender ends by rejecting cookies(); that's expected, not an error.
        if ((err as { digest?: string })?.digest !== "HANGING_PROMISE_REJECTION") {
          console.error("[cart] load failed", err);
        }
        return null;
      })
    : Promise.resolve(null);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers shop={shop} cartPromise={cartPromise}>
          <Header />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer />
          <CartDrawer />
          <Suspense fallback={null}>
            <ShopifyAnalyticsLoader />
          </Suspense>
        </Providers>
        {/* Vercel-only: these beacons 404 off Vercel, so skip them on Cloudflare. */}
        {isVercel ? (
          <Suspense fallback={null}>
            <Analytics />
            <SpeedInsights />
          </Suspense>
        ) : null}
      </body>
    </html>
  );
}
