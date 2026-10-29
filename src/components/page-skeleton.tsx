import { ProductGridSkeleton } from "@/components/product-card";

export function ListingPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6" aria-busy="true">
      <div className="mb-8 flex flex-col gap-3 border-b border-line pb-6">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-12 w-72" />
      </div>
      <ProductGridSkeleton />
    </main>
  );
}

export function ProductPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6" aria-busy="true">
      <div className="skeleton mb-6 h-3 w-40" />
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <div className="skeleton aspect-square w-full" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-6 w-24" />
          <div className="skeleton mt-6 h-10 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      </div>
    </main>
  );
}
