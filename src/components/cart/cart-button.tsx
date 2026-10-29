"use client";

import { Suspense } from "react";
import { useCart, useCartContext } from "./cart-context";

function Count() {
  const cart = useCart();
  const n = cart?.totalQuantity ?? 0;
  return (
    <>
      <span className="sr-only">{`${n} ${n === 1 ? "item" : "items"} in cart`}</span>
      {n > 0 ? (
        <span
          aria-hidden
          data-testid="cart-count"
          className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center bg-glitch px-1 text-[11px] font-bold text-white"
        >
          {n}
        </span>
      ) : null}
    </>
  );
}

export function CartButton() {
  const { setOpen } = useCartContext();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open cart"
      data-testid="cart-button"
      className="relative grid h-9 w-9 place-items-center border border-line hover:border-glitch"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <Suspense fallback={null}>
        <Count />
      </Suspense>
    </button>
  );
}
