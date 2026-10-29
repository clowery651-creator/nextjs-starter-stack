import { CartLinesSkeleton } from "@/components/cart/cart-lines";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="skeleton mb-8 h-12 w-40" />
      <CartLinesSkeleton rows={3} />
    </main>
  );
}
