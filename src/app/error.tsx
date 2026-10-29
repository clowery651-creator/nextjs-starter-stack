"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-6 px-4 py-24 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-glitch-soft">Error</p>
      <h1 className="font-display text-5xl uppercase">
        <span className="glitch" data-text="Signal lost">
          Signal lost
        </span>
      </h1>
      <p className="text-muted">Something went wrong loading this page. Try again, or head back to the shop.</p>
      {error.digest ? <p className="font-mono text-xs text-muted">Ref: {error.digest}</p> : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-glitch px-6 py-3 font-display text-lg uppercase tracking-wider text-white hover:bg-glitch-strong"
        >
          Try again
        </button>
        <Link href="/products" className="border border-line px-6 py-3 font-display text-lg uppercase tracking-wider hover:border-fg">
          Shop all
        </Link>
      </div>
    </main>
  );
}
