"use client";

import { useCart } from "./cart-context";
import { CartEmpty, CartError, CartLines, CartSummary } from "./cart-lines";

/** Full-page cart (/cart). Shares state and optimistic updates with the drawer. */
export function CartView() {
  const cart = useCart();
  if (!cart || cart.lines.nodes.length === 0) return <CartEmpty />;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <CartError />
        <CartLines cart={cart} />
      </div>
      <aside className="h-fit border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 font-display text-2xl uppercase">Summary</h2>
        <CartSummary cart={cart} />
      </aside>
    </div>
  );
}
