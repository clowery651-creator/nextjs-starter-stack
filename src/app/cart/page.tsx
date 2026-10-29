import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Image, Money } from "@/components/hydrogen";
import { ErrorBox, NotConfigured } from "@/components/not-configured";
import { getCart, isShopifyConfigured, type Cart } from "@/lib/shopify";
import { removeLine, updateLineQuantity } from "./actions";

export const metadata: Metadata = { title: "Cart" };

function QtyButton({
  lineId,
  quantity,
  label,
  children,
}: {
  lineId: string;
  quantity: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={updateLineQuantity}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        aria-label={label}
        className="h-8 w-8 rounded-full border border-zinc-300 dark:border-zinc-700"
      >
        {children}
      </button>
    </form>
  );
}

async function CartContents() {
  if (!isShopifyConfigured()) return <NotConfigured />;

  let cart: Cart | null;
  try {
    cart = await getCart(); // always fresh: no-store + cookies()
  } catch (err) {
    return (
      <ErrorBox
        title="Couldn't load your cart."
        message={err instanceof Error ? err.message : "Unknown error"}
      />
    );
  }

  if (!cart || cart.lines.nodes.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-zinc-600 dark:text-zinc-400">Your cart is empty.</p>
        <Link href="/products" className="font-medium underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {cart.lines.nodes.map((line) => {
          const m = line.merchandise;
          const options = m.selectedOptions
            .filter((o) => o.value !== "Default Title")
            .map((o) => `${o.name}: ${o.value}`)
            .join(" · ");
          return (
            <li key={line.id} data-testid="cart-line" className="flex gap-4 py-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                {m.image ? (
                  <Image
                    data={m.image}
                    alt={m.image.altText ?? m.product.title}
                    aspectRatio="1/1"
                    sizes="96px"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/products/${m.product.handle}`} className="font-medium">
                      {m.product.title}
                    </Link>
                    {options ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{options}</p>
                    ) : null}
                  </div>
                  <Money data={line.cost.totalAmount} className="font-medium" />
                </div>
                <div className="flex items-center gap-3">
                  <QtyButton lineId={line.id} quantity={line.quantity - 1} label="Decrease quantity">
                    −
                  </QtyButton>
                  <span aria-label="Quantity" className="w-6 text-center">
                    {line.quantity}
                  </span>
                  <QtyButton lineId={line.id} quantity={line.quantity + 1} label="Increase quantity">
                    +
                  </QtyButton>
                  <form action={removeLine} className="ml-4">
                    <input type="hidden" name="lineId" value={line.id} />
                    <button type="submit" className="text-sm underline">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col items-end gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="flex gap-2 text-lg">
          <span>Subtotal</span>
          <Money data={cart.cost.subtotalAmount} className="font-semibold" />
        </p>
        <p className="text-sm text-zinc-500">Taxes and shipping calculated at checkout.</p>
        {/* Shopify-hosted checkout. Plain <a>: it's an external URL. */}
        <a
          href={cart.checkoutUrl}
          data-testid="checkout"
          className="rounded-full bg-black px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
        >
          Checkout
        </a>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Cart</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading cart…</p>}>
        <CartContents />
      </Suspense>
    </main>
  );
}
