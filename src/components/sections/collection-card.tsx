import NextImage from "next/image";
import Link from "next/link";
import type { CollectionSummary } from "@/lib/shopify";

export function CollectionCard({ collection, priority = false }: { collection: CollectionSummary; priority?: boolean }) {
  const img = collection.coverImage;
  return (
    <Link
      href={`/collections/${collection.handle}`}
      data-testid="collection-card"
      className="group relative block aspect-[4/3] overflow-hidden border border-line bg-surface-2"
    >
      {img ? (
        <NextImage
          src={img.url}
          alt={img.altText ?? collection.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
      ) : null}
      <div className="scanlines absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-3xl uppercase leading-none">
          <span className="glitch" data-text={collection.title}>
            {collection.title}
          </span>
        </h3>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-glitch-soft group-hover:text-fg">
          Shop collection →
        </p>
      </div>
    </Link>
  );
}

export function CollectionGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton aspect-[4/3] border border-line" />
      ))}
    </ul>
  );
}
