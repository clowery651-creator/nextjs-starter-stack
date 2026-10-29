"use server";

import { refresh } from "next/cache";
import {
  addCartLines,
  isShopifyConfigured,
  removeCartLines,
  updateCartLines,
} from "@/lib/shopify";

export type CartActionState = { ok: boolean; message: string } | null;

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export async function addToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  if (!isShopifyConfigured()) return { ok: false, message: "Shopify isn't connected." };
  const merchandiseId = String(formData.get("merchandiseId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  if (!merchandiseId) return { ok: false, message: "Pick a variant first." };
  try {
    await addCartLines([{ merchandiseId, quantity }]);
    refresh();
    return { ok: true, message: "Added to cart" };
  } catch (err) {
    return { ok: false, message: errorMessage(err) };
  }
}

export async function updateLineQuantity(formData: FormData): Promise<void> {
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!lineId || !Number.isFinite(quantity)) return;
  if (quantity <= 0) await removeCartLines([lineId]);
  else await updateCartLines([{ id: lineId, quantity }]);
  refresh();
}

export async function removeLine(formData: FormData): Promise<void> {
  const lineId = String(formData.get("lineId") ?? "");
  if (!lineId) return;
  await removeCartLines([lineId]);
  refresh();
}
