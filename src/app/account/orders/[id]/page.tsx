import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  AccountSkeleton,
  AccountTabs,
  HostedAccount,
  SignInPanel,
  StatusBadge,
} from "@/components/account/account-ui";
import { formatDate, formatMoney, humanize } from "@/components/account/format";
import { ErrorBox } from "@/components/not-configured";
import {
  CustomerUnauthorizedError,
  getAccountViewer,
  getCustomerOrder,
  rethrowIfPrerenderAbort,
  type OrderDetail,
} from "@/lib/customer-account";

export const metadata: Metadata = { title: "Order details" };

// Private, per-customer route with no static params: render at request time
// (the root layout's client hooks read the pathname).
export const instant = false;

export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Suspense fallback={<AccountSkeleton />}>
        <Order params={params} />
      </Suspense>
    </main>
  );
}

async function Order({ params }: { params: PageProps<"/account/orders/[id]">["params"] }) {
  const { id } = await params;
  const viewer = await getAccountViewer();
  if (viewer.mode === "hosted") return <HostedAccount />;
  if (viewer.mode === "signed-out") return <SignInPanel returnTo={`/account/orders/${encodeURIComponent(id)}`} />;

  let order: OrderDetail | null;
  try {
    order = await getCustomerOrder(id);
  } catch (err) {
    rethrowIfPrerenderAbort(err);
    if (err instanceof CustomerUnauthorizedError) {
      return <SignInPanel returnTo={`/account/orders/${encodeURIComponent(id)}`} error="expired" />;
    }
    console.error("[accounts] order failed", err);
    return <ErrorBox title="We couldn't load this order." message="Please refresh and try again." />;
  }
  if (!order) notFound();

  const rows: [string, string][] = [
    ["Subtotal", formatMoney(order.subtotal)],
    ["Shipping", formatMoney(order.totalShipping)],
    ["Tax", formatMoney(order.totalTax)],
  ];
  if (Number(order.totalRefunded.amount) > 0) rows.push(["Refunded", `−${formatMoney(order.totalRefunded)}`]);

  return (
    <>
      <AccountTabs current="orders" />
      <Link href="/account/orders" className="text-sm text-muted hover:text-fg">
        ← All orders
      </Link>
      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-glitch-soft">
            Placed {formatDate(order.processedAt)}
          </p>
          <h1 className="font-display text-4xl uppercase sm:text-5xl">Order {order.name}</h1>
          {order.confirmationNumber ? (
            <p className="mt-1 text-sm text-muted">Confirmation {order.confirmationNumber}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {order.cancelledAt ? <StatusBadge value="CANCELLED" tone="muted" /> : <StatusBadge value={order.fulfillmentStatus} />}
          <StatusBadge value={order.financialStatus} />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="items-h">
          <h2 id="items-h" className="sr-only">
            Items
          </h2>
          <ul className="flex flex-col divide-y divide-line border border-line" data-testid="order-lines">
            {order.lineItems.nodes.map((l) => (
              <li key={l.id} className="flex gap-4 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-surface-2">
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- order images can come from any CDN host
                    <img src={l.image.url} alt={l.image.altText ?? l.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="font-medium">{l.name}</p>
                  {l.variantTitle ? <p className="text-sm text-muted">{l.variantTitle}</p> : null}
                  <p className="mt-auto text-sm text-muted">
                    {l.quantity} × {formatMoney(l.price)}
                  </p>
                </div>
                <p className="font-medium">{formatMoney(l.totalPrice)}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="border border-line bg-surface p-5" aria-labelledby="totals-h">
            <h2 id="totals-h" className="font-display text-xl uppercase">
              Summary
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(order.totalPrice)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-line bg-surface p-5" aria-labelledby="ship-h">
            <h2 id="ship-h" className="font-display text-xl uppercase">
              Shipping
            </h2>
            {order.fulfillments.nodes.length ? (
              <ul className="mt-3 flex flex-col gap-4 text-sm">
                {order.fulfillments.nodes.map((f) => (
                  <li key={f.id}>
                    <p>
                      <StatusBadge value={f.latestShipmentStatus ?? f.status} />{" "}
                      <span className="text-muted">{formatDate(f.createdAt)}</span>
                    </p>
                    {f.estimatedDeliveryAt ? (
                      <p className="mt-1 text-muted">Est. delivery {formatDate(f.estimatedDeliveryAt)}</p>
                    ) : null}
                    {f.trackingInformation.map((t) => (
                      <p key={`${t.company}-${t.number}`} className="mt-1">
                        {t.company ?? "Carrier"}{" "}
                        {t.url ? (
                          <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-glitch-soft hover:text-fg">
                            {t.number ?? "Track"} ↗
                          </a>
                        ) : (
                          t.number
                        )}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">{humanize(order.fulfillmentStatus)}. Tracking appears here once it ships.</p>
            )}
            {order.shippingAddress?.formatted?.length ? (
              <address className="mt-4 border-t border-line pt-3 text-sm not-italic text-muted">
                {order.shippingAddress.formatted.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
          </section>

          <a
            href={order.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-line px-4 py-3 text-center text-sm font-medium uppercase tracking-wider hover:border-glitch hover:text-glitch-soft"
          >
            Order status page ↗
          </a>
        </aside>
      </div>
    </>
  );
}
