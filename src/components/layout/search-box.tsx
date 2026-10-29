"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { PredictiveResult } from "@/lib/shopify/search";

/**
 * Header search: a plain GET form to /search (works without JS) with
 * type-ahead suggestions from the Storefront `predictiveSearch` API.
 */
export function SearchBox({ autoFocus = false, className = "" }: { autoFocus?: boolean; className?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<PredictiveResult | null>(null);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setQ(initial);
  }

  useEffect(() => {
    const term = q.trim();
    // Only fetch while the dropdown is in use (not for a prefilled ?q= on load).
    if (!open || term.length < 2) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setResults((await res.json()) as PredictiveResult);
      } catch {
        /* aborted or offline: keep previous suggestions */
      }
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q, open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const show = open && q.trim().length >= 2 && results && (results.products.length > 0 || results.collections.length > 0);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form
        action="/search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          const term = q.trim();
          router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <input
          id={`${listId}-input`}
          name="q"
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Search the drop…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          aria-controls={listId}
          aria-expanded={Boolean(show)}
          role="combobox"
          aria-autocomplete="list"
          className="h-9 w-full border border-line bg-surface px-3 text-sm placeholder:text-muted focus:border-glitch focus:outline-none md:w-64"
        />
      </form>
      {show ? (
        <div
          id={listId}
          role="listbox"
          className="absolute right-0 top-11 z-40 w-80 border border-line bg-surface p-2 text-sm shadow-2xl"
        >
          {results.products.map((p) => (
            <Link
              key={p.id}
              role="option"
              aria-selected={false}
              href={`/products/${p.handle}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-2 hover:bg-surface-2"
            >
              {p.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- tiny Shopify CDN thumbnail
                <img
                  src={`${p.featuredImage.url}${p.featuredImage.url.includes("?") ? "&" : "?"}width=80`}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                />
              ) : (
                <span className="h-10 w-10 bg-surface-2" />
              )}
              <span className="line-clamp-1 flex-1">{p.title}</span>
            </Link>
          ))}
          {results.collections.map((c) => (
            <Link
              key={c.id}
              role="option"
              aria-selected={false}
              href={`/collections/${c.handle}`}
              onClick={() => setOpen(false)}
              className="block p-2 text-muted hover:bg-surface-2 hover:text-fg"
            >
              Collection: {c.title}
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(q.trim())}`}
            onClick={() => setOpen(false)}
            className="mt-1 block border-t border-line p-2 font-medium text-glitch-soft"
          >
            See all results for “{q.trim()}”
          </Link>
        </div>
      ) : null}
    </div>
  );
}
