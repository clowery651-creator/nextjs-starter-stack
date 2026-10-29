"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useCart, useCartContext } from "./cart-context";
import { CartEmpty, CartError, CartLines, CartLinesSkeleton, CartSummary } from "./cart-lines";

function DrawerBody() {
  const cart = useCart();
  const { setOpen } = useCartContext();
  if (!cart || cart.lines.nodes.length === 0) return <CartEmpty onNavigate={() => setOpen(false)} />;
  return (
    <>
      <div className="-mx-5 flex-1 overflow-y-auto px-5">
        <CartLines cart={cart} compact />
      </div>
      <div className="border-t border-line pt-4">
        <CartSummary cart={cart} />
        <Link
          href="/cart"
          onClick={() => setOpen(false)}
          className="mt-3 block text-center text-sm text-muted underline underline-offset-4 hover:text-fg"
        >
          View full cart
        </Link>
      </div>
    </>
  );
}

function DrawerTitle() {
  const cart = useCart();
  return <>{cart?.totalQuantity ? ` (${cart.totalQuantity})` : ""}</>;
}

/** Slide-over cart. Opens on add-to-cart and from the header button. */
export function CartDrawer() {
  const { isOpen, setOpen } = useCartContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, [isOpen, setOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        data-testid="cart-drawer"
        data-open={isOpen}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface p-5 shadow-2xl transition-transform duration-300 ease-out focus:outline-none motion-reduce:transition-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="cart-drawer-title" className="font-display text-2xl uppercase">
            Your cart
            <Suspense fallback={null}>
              <DrawerTitle />
            </Suspense>
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="grid h-9 w-9 place-items-center border border-line hover:border-glitch"
          >
            ✕
          </button>
        </div>
        <CartError />
        <Suspense fallback={<CartLinesSkeleton />}>
          <DrawerBody />
        </Suspense>
      </div>
    </div>
  );
}
