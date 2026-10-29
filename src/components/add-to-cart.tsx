"use client";

import { Image, Money } from "@shopify/hydrogen-react";
import { useMemo, useState } from "react";
import { useCartContext } from "@/components/cart/cart-context";
import type { ProductDetail } from "@/lib/shopify/types";

export function ProductView({ product }: { product: ProductDetail }) {
  const variants = product.variants.nodes;
  const initial = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries((initial?.selectedOptions ?? []).map((o) => [o.name, o.value])),
  );
  const { addItem, pending } = useCartContext();

  const variant = useMemo(
    () => variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value)),
    [variants, selected],
  );

  const gallery = useMemo(() => {
    const imgs = product.images.nodes.length ? product.images.nodes : product.featuredImage ? [product.featuredImage] : [];
    return imgs;
  }, [product]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  // Selecting a variant with its own image shows that image.
  const shown =
    (activeUrl && gallery.find((g) => g.url === activeUrl)) || variant?.image || gallery[0] || null;

  const showOptions = !(product.options.length === 1 && product.options[0].optionValues.length === 1);

  function isAvailable(name: string, value: string) {
    const next = { ...selected, [name]: value };
    return variants.some((v) => v.availableForSale && v.selectedOptions.every((o) => next[o.name] === o.value));
  }

  const canAdd = Boolean(variant?.availableForSale);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden border border-line bg-surface-2">
          {shown ? (
            <Image
              key={shown.url}
              data={shown}
              alt={shown.altText ?? product.title}
              aspectRatio="1/1"
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="aspect-square w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="aspect-square w-full" />
          )}
        </div>
        {gallery.length > 1 ? (
          <ul className="grid grid-cols-5 gap-2" aria-label="Product images">
            {gallery.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  onClick={() => setActiveUrl(img.url)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={shown?.url === img.url}
                  className="block w-full overflow-hidden border border-line aria-pressed:border-glitch"
                >
                  <Image data={img} alt="" aspectRatio="1/1" sizes="120px" className="aspect-square w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          {product.vendor ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-glitch-soft">{product.vendor}</p>
          ) : null}
          <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">{product.title}</h1>
          {variant ? (
            <p className="mt-4 flex items-baseline gap-3 text-xl">
              <Money as="span" data={variant.price} />
              {variant.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount) ? (
                <Money as="span" data={variant.compareAtPrice} className="text-base text-muted line-through" />
              ) : null}
            </p>
          ) : (
            <p className="mt-4 text-muted">This combination isn&apos;t available.</p>
          )}
        </div>

        {showOptions
          ? product.options.map((option) => (
              <fieldset key={option.name}>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {option.name}
                  {selected[option.name] ? <span className="ml-2 text-fg">{selected[option.name]}</span> : null}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {option.optionValues.map(({ name: value }) => {
                    const active = selected[option.name] === value;
                    const available = isAvailable(option.name, value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setSelected((s) => ({ ...s, [option.name]: value }));
                          setActiveUrl(null);
                        }}
                        className={`min-w-12 border px-3 py-2 text-sm transition-colors ${
                          active ? "border-glitch bg-glitch text-white" : "border-line hover:border-fg"
                        } ${available ? "" : "text-muted line-through opacity-50"}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))
          : null}

        <button
          type="button"
          data-testid="add-to-cart"
          disabled={!canAdd}
          onClick={() => {
            if (!variant) return;
            addItem({
              merchandiseId: variant.id,
              quantity: 1,
              title: variant.title,
              image: variant.image ?? product.featuredImage,
              price: variant.price,
              selectedOptions: variant.selectedOptions,
              product: { id: product.id, handle: product.handle, title: product.title, vendor: product.vendor },
            });
          }}
          className="bg-glitch py-4 font-display text-xl uppercase tracking-wider text-white transition-colors hover:bg-glitch-strong disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted"
        >
          {!variant ? "Unavailable" : variant.availableForSale ? (pending ? "Add another" : "Add to cart") : "Sold out"}
        </button>

        {product.descriptionHtml ? (
          <div className="rte border-t border-line pt-6 text-sm" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        ) : null}
      </div>
    </div>
  );
}
