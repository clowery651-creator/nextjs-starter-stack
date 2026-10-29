"use server";

import { refresh } from "next/cache";
import {
  addCartLines,
  isShopifyConfigured,
  removeCartLines,
  updateCartLines,
  type Cart,
} from "@/lib/shopify";

export type CartActionResult =
  | { ok: true; cart: Cart }
  | { ok: false; message: string };

function fail(err: unknown): CartActionResult {
  return { ok: false, message: err instanceof Error ? err.message : "Something went wrong" };
}

const MAX_QTY = 99;

export async function addToCartAction(
  merchandiseId: string,
  quantity = 1,
): Promise<CartActionResult> {
  if (!isShopifyConfigured()) return { ok: false, message: "Shopify isn't connected." };
  if (!merchandiseId?.startsWith("gid://shopify/ProductVariant/")) {
    return { ok: false, message: "Pick a size or option first." };
  }
  const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(quantity) || 1));
  try {
    const cart = await addCartLines([{ merchandiseId, quantity: qty }]);
    refresh();
    return { ok: true, cart };
  } catch (err) {
    return fail(err);
  }
}

export async function updateLineAction(
  lineId: string,
  quantity: number,
): Promise<CartActionResult> {
  if (!lineId) return { ok: false, message: "Missing cart line." };
  const qty = Math.min(MAX_QTY, Math.floor(quantity));
  try {
    const cart =
      !Number.isFinite(qty) || qty <= 0
        ? await removeCartLines([lineId])
        : await updateCartLines([{ id: lineId, quantity: qty }]);
    refresh();
    return { ok: true, cart };
  } catch (err) {
    return fail(err);
  }
}

export async function removeLineAction(lineId: string): Promise<CartActionResult> {
  if (!lineId) return { ok: false, message: "Missing cart line." };
  try {
    const cart = await removeCartLines([lineId]);
    refresh();
    return { ok: true, cart };
  } catch (err) {
    return fail(err);
  }
}
