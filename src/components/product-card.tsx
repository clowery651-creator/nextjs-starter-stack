import Link from "next/link";
import { Image, Money } from "@/components/hydrogen";
import type { ProductCard as ProductCardType } from "@/lib/shopify/types";

export function ProductCard({ product, priority = false }: { product: ProductCardType; priority?: boolean }) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const hasRange = minVariantPrice.amount !== maxVariantPrice.amount;
  const compareAt = product.compareAtPriceRange?.maxVariantPrice;
  const onSale = compareAt && Number(compareAt.amount) > Number(minVariantPrice.amount);
  return (
    <Link
      href={`/products/${product.handle}`}
      data-testid="product-card"
      className="group block border border-line bg-surface transition-colors hover:border-glitch"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            alt={product.featuredImage.altText ?? product.title}
            aspectRatio="1/1"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        {!product.availableForSale ? (
          <span className="absolute left-2 top-2 bg-bg/90 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
            Sold out
          </span>
        ) : onSale ? (
          <span className="absolute left-2 top-2 bg-glitch px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">
            Sale
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-glitch-soft">{product.title}</h3>
        <p className="text-sm text-muted">
          {hasRange ? "From " : null}
          <Money data={minVariantPrice} as="span" />
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardType[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="border border-line bg-surface">
          <div className="skeleton aspect-square" />
          <div className="flex flex-col gap-2 p-3">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
