import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-glitch-soft">404</p>
      <h1 className="font-display text-6xl uppercase">
        <span className="glitch" data-text="Glitch in the matrix">
          Glitch in the matrix
        </span>
      </h1>
      <p className="text-muted">This page doesn&apos;t exist, or it was moved.</p>
      <div className="flex gap-3">
        <Link
          href="/products"
          className="bg-glitch px-6 py-3 font-display text-lg uppercase tracking-wider text-white hover:bg-glitch-strong"
        >
          Shop all
        </Link>
        <Link href="/search" className="border border-line px-6 py-3 font-display text-lg uppercase tracking-wider hover:border-fg">
          Search
        </Link>
      </div>
    </main>
  );
}
