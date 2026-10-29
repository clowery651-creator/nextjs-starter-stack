import "server-only";
import { cookies } from "next/headers";
import { storefrontFetch } from "./client";
import { CART_FRAGMENT } from "./fragments";
import type { Cart, CartLineUpdateInput } from "./types";

/** httpOnly cookie that holds the Storefront cart id. */
export const CART_COOKIE = "cartId";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

type UserError = { field: string[] | null; message: string };
type CartPayload = { cart: Cart | null; userErrors: UserError[] };

function unwrap(payload: CartPayload): Cart {
  if (payload.userErrors.length) {
    throw new Error(payload.userErrors.map((e) => e.message).join("; "));
  }
  if (!payload.cart) throw new Error("Shopify returned no cart");
  return payload.cart;
}

const CART_QUERY = /* GraphQL */ `
  query Cart($cartId: ID!) { cart(id: $cartId) { ...CartFields } }
  ${CART_FRAGMENT}
`;

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

export async function getCartId(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

/** Only callable from a Server Action or Route Handler. */
async function setCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

/** Current cart (never cached). Returns null if no cart or it expired. */
export async function getCart(): Promise<Cart | null> {
  const cartId = await getCartId();
  if (!cartId) return null;
  const data = await storefrontFetch<{ cart: Cart | null }>({
    query: CART_QUERY,
    variables: { cartId },
    cache: "no-store",
  });
  return data.cart;
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[] = [],
): Promise<Cart> {
  const data = await storefrontFetch<{ cartCreate: CartPayload }>({
    query: CART_CREATE,
    variables: { input: { lines } },
  });
  const cart = unwrap(data.cartCreate);
  await setCartId(cart.id);
  return cart;
}

export async function addCartLines(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const cartId = await getCartId();
  // No cart yet, or the old one expired: start a new one with these lines.
  if (!cartId || !(await getCart())) return createCart(lines);
  const data = await storefrontFetch<{ cartLinesAdd: CartPayload }>({
    query: CART_LINES_ADD,
    variables: { cartId, lines },
  });
  return unwrap(data.cartLinesAdd);
}

export async function updateCartLines(lines: CartLineUpdateInput[]): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart");
  const data = await storefrontFetch<{ cartLinesUpdate: CartPayload }>({
    query: CART_LINES_UPDATE,
    variables: { cartId, lines },
  });
  return unwrap(data.cartLinesUpdate);
}

export async function removeCartLines(lineIds: string[]): Promise<Cart> {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No cart");
  const data = await storefrontFetch<{ cartLinesRemove: CartPayload }>({
    query: CART_LINES_REMOVE,
    variables: { cartId, lineIds },
  });
  return unwrap(data.cartLinesRemove);
}
