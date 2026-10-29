import Link from "next/link";
import type { OrderSummary } from "@/lib/customer-account/api";
import {
  CUSTOMER_ACCOUNT_ORDERS_URL,
  CUSTOMER_ACCOUNT_PROFILE_URL,
  CUSTOMER_ACCOUNT_URL,
} from "@/lib/site";
import { formatDate, formatMoney, humanize } from "./format";

const primaryBtn =
  "inline-flex items-center justify-center bg-glitch px-6 py-3 font-display text-lg uppercase tracking-wider text-white hover:bg-glitch-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glitch-soft";
const secondaryBtn =
  "inline-flex items-center justify-center border border-line px-6 py-3 font-display text-lg uppercase tracking-wider hover:border-fg";

const PERKS = [
  { title: "Track orders", body: "Live shipping status and tracking links for every drop." },
  { title: "Faster checkout", body: "Saved addresses so checkout takes seconds." },
  { title: "No password", body: "Sign in with a one-time code sent to your email." },
];

function Perks() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {PERKS.map((p) => (
        <li key={p.title} className="border border-line bg-bg/60 p-4">
          <p className="font-display text-lg uppercase tracking-wide text-glitch-soft">{p.title}</p>
          <p className="mt-1 text-sm text-muted">{p.body}</p>
        </li>
      ))}
    </ul>
  );
}

const ERRORS: Record<string, string> = {
  state: "Your sign-in link expired or was opened in another browser. Please try again.",
  token: "We couldn't finish signing you in. Please try again.",
  denied: "Sign-in was cancelled.",
  unavailable: "Accounts are temporarily unavailable. Please try again in a moment.",
  expired: "Your session expired. Please sign in again.",
};

export function AccountNotice({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <div role="alert" className="border border-danger/50 bg-danger/10 p-4 text-sm">
      {ERRORS[code] ?? ERRORS.token}
    </div>
  );
}

/**
 * Shown when SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID isn't set: native-looking
 * page that hands off to Shopify-hosted customer accounts.
 */
export function HostedAccount() {
  return (
    <div className="scanlines flex flex-col gap-6 border border-line bg-surface p-6 sm:p-8" data-testid="account-hosted">
      <div>
        <p className="font-display text-3xl uppercase">Welcome to the Twisted Zone</p>
        <p className="mt-2 text-muted">
          Sign in or create an account with your email. You&apos;ll get a one-time code, so there&apos;s no password to
          remember.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a href={CUSTOMER_ACCOUNT_URL} data-testid="account-login" className={primaryBtn}>
          Sign in
        </a>
        <a href={CUSTOMER_ACCOUNT_URL} data-testid="account-create" className={secondaryBtn}>
          Create account
        </a>
      </div>
      <Perks />
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
        <a href={CUSTOMER_ACCOUNT_ORDERS_URL} className="text-muted hover:text-fg">
          Order history →
        </a>
        <a href={CUSTOMER_ACCOUNT_PROFILE_URL} className="text-muted hover:text-fg">
          Profile &amp; addresses →
        </a>
        <Link href="/products" className="text-muted hover:text-fg">
          Keep shopping →
        </Link>
      </div>
      <p className="text-xs text-muted">
        Secure sign-in by Shopify at{" "}
        <span className="text-fg">{CUSTOMER_ACCOUNT_URL.replace("https://", "")}</span>.
      </p>
    </div>
  );
}

/** In-app accounts are configured but nobody is signed in. */
export function SignInPanel({ returnTo = "/account", error }: { returnTo?: string; error?: string }) {
  const href = `/account/login?return_to=${encodeURIComponent(returnTo)}`;
  return (
    <div className="scanlines flex flex-col gap-6 border border-line bg-surface p-6 sm:p-8" data-testid="account-signin">
      <AccountNotice code={error} />
      <div>
        <p className="font-display text-3xl uppercase">Welcome to the Twisted Zone</p>
        <p className="mt-2 text-muted">
          Sign in or create an account with just your email. We&apos;ll send a one-time code, no password needed.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Plain <a>: route handlers must be full navigations, not client transitions. */}
        <a href={href} data-testid="account-login" className={primaryBtn}>
          Sign in
        </a>
        <a href={href} data-testid="account-create" className={secondaryBtn}>
          Create account
        </a>
      </div>
      <Perks />
    </div>
  );
}

export function AccountTabs({ current }: { current: "overview" | "orders" }) {
  const tab = (key: typeof current, href: string, label: string) => (
    <Link
      href={href}
      aria-current={current === key ? "page" : undefined}
      className="border-b-2 border-transparent px-1 pb-2 text-sm font-medium uppercase tracking-wider text-muted hover:text-fg aria-[current=page]:border-glitch aria-[current=page]:text-fg"
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Account" className="mb-8 flex items-center gap-6 border-b border-line">
      {tab("overview", "/account", "Overview")}
      {tab("orders", "/account/orders", "Orders")}
      <form action="/account/logout" method="post" className="ml-auto pb-2">
        <button type="submit" className="text-sm font-medium uppercase tracking-wider text-muted hover:text-glitch-soft">
          Sign out
        </button>
      </form>
    </nav>
  );
}

export function StatusBadge({ value, tone }: { value: string | null; tone?: "ok" | "warn" | "muted" }) {
  const t =
    tone ??
    (value && /^(PAID|FULFILLED|SUCCESS|DELIVERED)$/.test(value)
      ? "ok"
      : value && /^(PENDING|UNFULFILLED|PARTIALLY|IN_PROGRESS|ON_HOLD|OPEN)/.test(value)
        ? "warn"
        : "muted");
  const cls =
    t === "ok"
      ? "border-success/50 text-success"
      : t === "warn"
        ? "border-glitch-soft/50 text-glitch-soft"
        : "border-line text-muted";
  return (
    <span className={`inline-block border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {humanize(value)}
    </span>
  );
}

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  if (!orders.length) {
    return (
      <div className="border border-dashed border-line p-8 text-center" data-testid="orders-empty">
        <p className="font-display text-2xl uppercase">No orders yet</p>
        <p className="mt-1 text-sm text-muted">When you place an order, it shows up here.</p>
        <Link href="/products" className={`${primaryBtn} mt-5`}>
          Shop the drop
        </Link>
      </div>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-line border border-line" data-testid="orders-list">
      {orders.map((o) => {
        const id = o.id.split("/").pop();
        return (
          <li key={o.id}>
            <Link
              href={`/account/orders/${id}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 hover:bg-surface-2 sm:p-5"
            >
              <div className="min-w-28">
                <p className="font-display text-xl uppercase">{o.name}</p>
                <p className="text-xs text-muted">{formatDate(o.processedAt)}</p>
              </div>
              <p className="flex-1 truncate text-sm text-muted">
                {o.lineItems.nodes.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
              </p>
              <div className="flex items-center gap-2">
                {o.cancelledAt ? (
                  <StatusBadge value="CANCELLED" tone="muted" />
                ) : (
                  <StatusBadge value={o.fulfillmentStatus} />
                )}
                <span className="min-w-20 text-right font-medium">{formatMoney(o.totalPrice)}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="skeleton h-10 w-64" />
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-48 w-full" />
    </div>
  );
}
