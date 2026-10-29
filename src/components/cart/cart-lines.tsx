"use client";

import { Image, Money } from "@shopify/hydrogen-react";
import Link from "next/link";
import type { Cart } from "@/lib/shopify/types";
import { useCartContext } from "./cart-context";

export function CartLines({ cart, compact = false }: { cart: Cart; compact?: boolean }) {
  const { updateLine, removeLine, setOpen } = useCartContext();
  const size = compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28";
  return (
    <ul className="divide-y divide-line">
      {cart.lines.nodes.map((line) => {
        const m = line.merchandise;
        const optimistic = line.id.startsWith("optimistic:");
        const options = m.selectedOptions
          .filter((o) => o.value !== "Default Title")
          .map((o) => `${o.name}: ${o.value}`)
          .join(" · ");
        return (
          <li
            key={line.id}
            data-testid="cart-line"
            className={`flex gap-4 py-4 transition-opacity ${optimistic ? "opacity-70" : ""}`}
          >
            <div className={`${size} shrink-0 overflow-hidden border border-line bg-surface-2`}>
              {m.image ? (
                <Image
                  data={m.image}
                  alt={m.image.altText ?? m.product.title}
                  aspectRatio="1/1"
                  sizes="112px"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${m.product.handle}`}
                    onClick={() => setOpen(false)}
                    className="line-clamp-2 text-sm font-medium hover:text-glitch-soft"
                  >
                    {m.product.title}
                  </Link>
                  {options ? <p className="mt-0.5 text-xs text-muted">{options}</p> : null}
                </div>
                <Money as="span" data={line.cost.totalAmount} className="shrink-0 text-sm font-medium" />
              </div>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex items-center border border-line">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${m.product.title}`}
                    disabled={optimistic}
                    onClick={() => updateLine(line.id, line.quantity - 1)}
                    className="grid h-8 w-8 place-items-center hover:bg-surface-2 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span aria-label="Quantity" data-testid="line-qty" className="w-8 text-center text-sm tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${m.product.title}`}
                    disabled={optimistic}
                    onClick={() => updateLine(line.id, line.quantity + 1)}
                    className="grid h-8 w-8 place-items-center hover:bg-surface-2 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  disabled={optimistic}
                  onClick={() => removeLine(line.id)}
                  className="text-xs text-muted underline underline-offset-4 hover:text-fg disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CartSummary({ cart }: { cart: Cart }) {
  const { pending } = useCartContext();
  const ready = Boolean(cart.checkoutUrl) && !pending;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm uppercase tracking-wider text-muted">Subtotal</span>
        <Money as="span" data={cart.cost.subtotalAmount} className="text-lg font-semibold" />
      </div>
      <p className="text-xs text-muted">Taxes and shipping calculated at checkout.</p>
      {/* Shopify-hosted checkout. Plain <a>: it's an external URL. */}
      <a
        href={ready ? cart.checkoutUrl : undefined}
        aria-disabled={!ready}
        data-testid="checkout"
        className={`block bg-glitch py-3 text-center font-display text-lg uppercase tracking-wider text-white transition-colors hover:bg-glitch-strong ${
          ready ? "" : "pointer-events-none opacity-60"
        }`}
      >
        {pending ? "Updating…" : "Checkout"}
      </a>
    </div>
  );
}

export function CartEmpty({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="text-muted">Your cart is empty.</p>
      <Link
        href="/products"
        onClick={onNavigate}
        className="border border-glitch px-4 py-2 text-sm font-medium uppercase tracking-wider hover:bg-glitch"
      >
        Shop the drop
      </Link>
    </div>
  );
}

export function CartError() {
  const { error, clearError } = useCartContext();
  if (!error) return null;
  return (
    <div role="alert" className="mb-3 flex items-start justify-between gap-3 border border-danger/50 bg-danger/10 p-3 text-sm">
      <span>{error}</span>
      <button type="button" onClick={clearError} aria-label="Dismiss" className="text-muted hover:text-fg">
        ✕
      </button>
    </div>
  );
}

export function CartLinesSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex gap-4 py-4">
          <div className="skeleton h-20 w-20" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
