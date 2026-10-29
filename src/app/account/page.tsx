import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/listing-controls";
import { CUSTOMER_ACCOUNT_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to your Twisted Reality E.N.T. account to see orders and manage your details.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: true },
};

/**
 * Customer accounts skeleton. Sign-in is handled by Shopify customer
 * accounts (hosted). A future step can add the Customer Account API
 * (OAuth + PKCE) to show orders here; see README → Customer accounts.
 */
export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <PageHeading title="Account" eyebrow="Your profile" />
      <div className="flex flex-col gap-6 border border-line bg-surface p-6 sm:p-8">
        <p className="text-muted">
          Accounts are managed by Shopify. Sign in with your email to view your orders, track shipments and update
          your addresses. You&apos;ll get a one-time code by email, so there&apos;s no password to remember.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={CUSTOMER_ACCOUNT_URL}
            data-testid="account-login"
            className="bg-glitch px-6 py-3 font-display text-lg uppercase tracking-wider text-white hover:bg-glitch-strong"
          >
            Sign in / view orders
          </a>
          <Link href="/products" className="border border-line px-6 py-3 font-display text-lg uppercase tracking-wider hover:border-fg">
            Keep shopping
          </Link>
        </div>
        <p className="text-xs text-muted">
          You&apos;ll be taken to <span className="text-fg">{CUSTOMER_ACCOUNT_URL.replace("https://", "")}</span>,
          Shopify&apos;s secure account page for this store.
        </p>
      </div>
    </main>
  );
}
