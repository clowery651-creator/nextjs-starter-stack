"use client";

import { Image, Money } from "@shopify/hydrogen-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { addToCart, type CartActionState } from "@/app/cart/actions";
import type { ProductDetail } from "@/lib/shopify/types";

export function VariantSelector({ product }: { product: ProductDetail }) {
  const variants = product.variants.nodes;
  const initial = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (initial?.selectedOptions ?? []).map((o) => [o.name, o.value]),
    ),
  );
  const [state, formAction, pending] = useActionState<CartActionState, FormData>(
    addToCart,
    null,
  );

  const variant = useMemo(
    () =>
      variants.find((v) =>
        v.selectedOptions.every((o) => selected[o.name] === o.value),
      ),
    [variants, selected],
  );

  const image = variant?.image ?? product.featuredImage;
  const showOptions = !(
    product.options.length === 1 &&
    product.options[0].optionValues.length === 1
  );

  function isAvailable(name: string, value: string) {
    const next = { ...selected, [name]: value };
    return variants.some(
      (v) =>
        v.availableForSale &&
        v.selectedOptions.every((o) => next[o.name] === o.value),
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {image ? (
          <Image
            data={image}
            alt={image.altText ?? product.title}
            aspectRatio="1/1"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-square w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900" />
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
          {variant ? (
            <p className="mt-2 flex items-baseline gap-2 text-lg">
              <Money data={variant.price} />
              {variant.compareAtPrice &&
              Number(variant.compareAtPrice.amount) > Number(variant.price.amount) ? (
                <Money
                  data={variant.compareAtPrice}
                  className="text-sm text-zinc-500 line-through"
                />
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-zinc-500">This combination isn&apos;t available.</p>
          )}
        </div>

        {showOptions
          ? product.options.map((option) => (
              <fieldset key={option.name}>
                <legend className="mb-2 text-sm font-medium">{option.name}</legend>
                <div className="flex flex-wrap gap-2">
                  {option.optionValues.map(({ name: value }) => {
                    const active = selected[option.name] === value;
                    const available = isAvailable(option.name, value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setSelected((s) => ({ ...s, [option.name]: value }))
                        }
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          active
                            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-zinc-300 dark:border-zinc-700"
                        } ${available ? "" : "opacity-40 line-through"}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))
          : null}

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="merchandiseId" value={variant?.id ?? ""} />
          <input type="hidden" name="quantity" value="1" />
          <button
            type="submit"
            disabled={!variant?.availableForSale || pending}
            className="rounded-full bg-black px-5 py-3 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {pending
              ? "Adding…"
              : !variant
                ? "Unavailable"
                : variant.availableForSale
                  ? "Add to cart"
                  : "Sold out"}
          </button>
          {state ? (
            <p
              role="status"
              className={`text-sm ${state.ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
            >
              {state.message}
              {state.ok ? (
                <>
                  {" · "}
                  <Link href="/cart" className="underline">
                    View cart
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </form>

        {product.descriptionHtml ? (
          <div
            className="prose prose-zinc max-w-none text-sm text-zinc-700 dark:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        ) : null}
      </div>
    </div>
  );
}
