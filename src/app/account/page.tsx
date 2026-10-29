import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  AccountNotice,
  AccountSkeleton,
  AccountTabs,
  HostedAccount,
  OrderList,
  SignInPanel,
} from "@/components/account/account-ui";
import { formatDate } from "@/components/account/format";
import { PageHeading } from "@/components/listing-controls";
import { ErrorBox } from "@/components/not-configured";
import { CustomerUnauthorizedError, getAccountViewer, getCustomerOverview, rethrowIfPrerenderAbort } from "@/lib/customer-account";
import { CUSTOMER_ACCOUNT_PROFILE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to your Twisted Reality E.N.T. account to see orders and manage your details.",
  alternates: { canonical: "/account" },
};

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <PageHeading title="Account" eyebrow="Your profile" />
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AccountContent({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const viewer = await getAccountViewer();
  if (viewer.mode === "hosted") return <HostedAccount />;
  if (viewer.mode === "signed-out") return <SignInPanel error={error} />;

  let customer: Awaited<ReturnType<typeof getCustomerOverview>>;
  try {
    customer = await getCustomerOverview();
  } catch (err) {
    rethrowIfPrerenderAbort(err);
    if (err instanceof CustomerUnauthorizedError) return <SignInPanel error="expired" />;
    console.error("[accounts] overview failed", err);
    return (
      <>
        <AccountTabs current="overview" />
        <ErrorBox title="We couldn't load your account." message="Please refresh, or sign out and back in." />
      </>
    );
  }

  const email = customer.emailAddress?.emailAddress;
  return (
    <>
      <AccountTabs current="overview" />
      <AccountNotice code={error} />
      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="profile-h" className="scanlines border border-line bg-surface p-6" data-testid="account-profile">
          <h2 id="profile-h" className="font-display text-2xl uppercase">
            {customer.displayName}
          </h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            {email ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
                <dd>{email}</dd>
              </div>
            ) : null}
            {customer.phoneNumber?.phoneNumber ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Phone</dt>
                <dd>{customer.phoneNumber.phoneNumber}</dd>
              </div>
            ) : null}
            {customer.defaultAddress?.formatted?.length ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Default address</dt>
                <dd>
                  {customer.defaultAddress.formatted.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Member since</dt>
              <dd>{formatDate(customer.creationDate)}</dd>
            </div>
          </dl>
          <a href={CUSTOMER_ACCOUNT_PROFILE_URL} className="mt-5 inline-block text-sm text-glitch-soft hover:text-fg">
            Edit profile &amp; addresses →
          </a>
        </section>
        <section aria-labelledby="recent-h">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="recent-h" className="font-display text-2xl uppercase">
              Recent orders
            </h2>
            <Link href="/account/orders" className="text-sm text-glitch-soft hover:text-fg">
              View all →
            </Link>
          </div>
          <OrderList orders={customer.orders.nodes} />
        </section>
      </div>
    </>
  );
}
