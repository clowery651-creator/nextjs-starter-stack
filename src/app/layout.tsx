import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { getShopifyConfig } from "@/lib/shopify";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js Starter Stack",
  description: "Next.js + Tailwind + Shopify Hydrogen React storefront starter",
};

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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers shop={shop}>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
