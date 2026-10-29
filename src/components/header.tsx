import Link from "next/link";
import { Suspense } from "react";
import { getCart, isShopifyConfigured } from "@/lib/shopify";

async function CartCount() {
  if (!isShopifyConfigured()) return null;
  let count = 0;
  try {
    count = (await getCart())?.totalQuantity ?? 0;
  } catch {
    count = 0;
  }
  return (
    <span
      aria-label={`${count} items in cart`}
      className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-xs font-semibold text-white dark:bg-white dark:text-black"
    >
      {count}
    </span>
  );
}

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Starter Stack
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/products">Products</Link>
          <Link href="/cart" className="inline-flex items-center">
            Cart
            <Suspense fallback={null}>
              <CartCount />
            </Suspense>
          </Link>
        </div>
      </nav>
    </header>
  );
}
