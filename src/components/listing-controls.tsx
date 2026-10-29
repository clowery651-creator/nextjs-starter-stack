import Link from "next/link";
import { SORT_OPTIONS, type SortOption } from "@/lib/shopify/sort";
import type { PageInfo } from "@/lib/shopify/types";

function hrefWith(basePath: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Sort links (plain links: work without JS, crawlable, cache-friendly). */
export function SortLinks({
  basePath,
  current,
  extra = {},
  options = SORT_OPTIONS,
}: {
  basePath: string;
  current: SortOption;
  extra?: Record<string, string | undefined>;
  options?: SortOption[];
}) {
  return (
    <nav aria-label="Sort" className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Sort:</span>
      {options.map((o) => {
        const active = o.slug === current.slug;
        return (
          <Link
            key={o.slug}
            href={hrefWith(basePath, { ...extra, sort: o.slug === "featured" ? undefined : o.slug })}
            aria-current={active ? "true" : undefined}
            scroll={false}
            className={`border px-2.5 py-1 transition-colors ${
              active ? "border-glitch bg-glitch/15 text-fg" : "border-line text-muted hover:border-fg hover:text-fg"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Pagination({
  basePath,
  pageInfo,
  params = {},
}: {
  basePath: string;
  pageInfo: PageInfo;
  params?: Record<string, string | undefined>;
}) {
  if (!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) return null;
  const cls =
    "border border-line px-4 py-2 text-sm font-medium uppercase tracking-wider hover:border-glitch hover:text-glitch-soft";
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
      {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
        <Link rel="prev" className={cls} href={hrefWith(basePath, { ...params, before: pageInfo.startCursor })}>
          ← Previous
        </Link>
      ) : null}
      {pageInfo.hasNextPage && pageInfo.endCursor ? (
        <Link rel="next" className={cls} href={hrefWith(basePath, { ...params, after: pageInfo.endCursor })}>
          Next →
        </Link>
      ) : null}
    </nav>
  );
}

export function PageHeading({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 border-b border-line pb-6">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.25em] text-glitch-soft">{eyebrow}</p> : null}
      <h1 className="font-display text-4xl uppercase sm:text-5xl">
        <span className="glitch" data-text={title}>
          {title}
        </span>
      </h1>
      {children}
    </div>
  );
}
