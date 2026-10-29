import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountSkeleton, AccountTabs, HostedAccount, OrderList, SignInPanel } from "@/components/account/account-ui";
import { PageHeading } from "@/components/listing-controls";
import { ErrorBox } from "@/components/not-configured";
import { CustomerUnauthorizedError, getAccountViewer, getCustomerOrders, rethrowIfPrerenderAbort } from "@/lib/customer-account";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <PageHeading title="Orders" eyebrow="Your account" />
      <Suspense fallback={<AccountSkeleton />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const pageBtn =
  "border border-line px-4 py-2 text-sm font-medium uppercase tracking-wider hover:border-glitch hover:text-glitch-soft";

async function Orders({ searchParams }: { searchParams: PageProps<"/account/orders">["searchParams"] }) {
  const sp = await searchParams;
  const after = typeof sp.after === "string" ? sp.after : undefined;
  const before = typeof sp.before === "string" ? sp.before : undefined;
  const viewer = await getAccountViewer();
  if (viewer.mode === "hosted") return <HostedAccount />;
  if (viewer.mode === "signed-out") return <SignInPanel returnTo="/account/orders" />;

  let result: Awaited<ReturnType<typeof getCustomerOrders>>;
  try {
    result = await getCustomerOrders({ after, before });
  } catch (err) {
    rethrowIfPrerenderAbort(err);
    if (err instanceof CustomerUnauthorizedError) return <SignInPanel returnTo="/account/orders" error="expired" />;
    console.error("[accounts] orders failed", err);
    return (
      <>
        <AccountTabs current="orders" />
        <ErrorBox title="We couldn't load your orders." message="Please refresh and try again." />
      </>
    );
  }
  const { nodes, pageInfo } = result;
  return (
    <>
      <AccountTabs current="orders" />
      <OrderList orders={nodes} />
      {pageInfo.hasNextPage || pageInfo.hasPreviousPage ? (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
          {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
            <Link rel="prev" className={pageBtn} href={`/account/orders?before=${encodeURIComponent(pageInfo.startCursor)}`}>
              ← Newer
            </Link>
          ) : null}
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <Link rel="next" className={pageBtn} href={`/account/orders?after=${encodeURIComponent(pageInfo.endCursor)}`}>
              Older →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
