"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  addToCartAction,
  removeLineAction,
  updateLineAction,
  type CartActionResult,
} from "@/app/cart/actions";
import { trackAddToCart } from "@/components/analytics/shopify-events";
import type { Cart, CartLine, Money } from "@/lib/shopify/types";

/** What the product page knows about a variant, used for the optimistic line. */
export type AddItemInput = {
  merchandiseId: string;
  quantity?: number;
  title: string;
  image: CartLine["merchandise"]["image"];
  price: Money;
  selectedOptions: CartLine["merchandise"]["selectedOptions"];
  product: CartLine["merchandise"]["product"];
};

type CartOp =
  | { type: "add"; item: AddItemInput }
  | { type: "update"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string };

type CartContextValue = {
  cartPromise: Promise<Cart | null>;
  ops: CartOp[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  clearError: () => void;
  addItem: (item: AddItemInput) => void;
  updateLine: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function times(m: Money, qty: number): Money {
  return { ...m, amount: (Number(m.amount) * qty).toFixed(2) };
}

function emptyCart(currency: Money["currencyCode"]): Cart {
  const zero = { amount: "0.00", currencyCode: currency };
  return {
    id: "optimistic",
    checkoutUrl: "",
    totalQuantity: 0,
    cost: { subtotalAmount: zero, totalAmount: zero },
    lines: { nodes: [] },
  };
}

/** Apply pending (optimistic) operations on top of the server cart. */
export function applyOps(cart: Cart | null, ops: CartOp[]): Cart | null {
  if (!ops.length) return cart;
  const firstAdd = ops.find((o) => o.type === "add") as Extract<CartOp, { type: "add" }> | undefined;
  let next: Cart | null = cart
    ? { ...cart, lines: { nodes: [...cart.lines.nodes] } }
    : firstAdd
      ? emptyCart(firstAdd.item.price.currencyCode)
      : null;
  if (!next) return null;

  for (const op of ops) {
    const lines = next.lines.nodes;
    if (op.type === "add") {
      const qty = op.item.quantity ?? 1;
      const i = lines.findIndex((l) => l.merchandise.id === op.item.merchandiseId);
      if (i >= 0) {
        const l = lines[i];
        const quantity = l.quantity + qty;
        lines[i] = {
          ...l,
          quantity,
          cost: { ...l.cost, totalAmount: times(l.cost.amountPerQuantity, quantity) },
        };
      } else {
        lines.push({
          id: `optimistic:${op.item.merchandiseId}`,
          quantity: qty,
          cost: { amountPerQuantity: op.item.price, totalAmount: times(op.item.price, qty) },
          merchandise: {
            id: op.item.merchandiseId,
            title: op.item.title,
            image: op.item.image,
            selectedOptions: op.item.selectedOptions,
            product: op.item.product,
          },
        });
      }
    } else if (op.type === "update") {
      const i = lines.findIndex((l) => l.id === op.lineId);
      if (i >= 0) {
        if (op.quantity <= 0) lines.splice(i, 1);
        else
          lines[i] = {
            ...lines[i],
            quantity: op.quantity,
            cost: {
              ...lines[i].cost,
              totalAmount: times(lines[i].cost.amountPerQuantity, op.quantity),
            },
          };
      }
    } else {
      const i = lines.findIndex((l) => l.id === op.lineId);
      if (i >= 0) lines.splice(i, 1);
    }
  }

  const currency = next.cost.subtotalAmount.currencyCode;
  const subtotal = next.lines.nodes.reduce((sum, l) => sum + Number(l.cost.totalAmount.amount), 0);
  const money = { amount: subtotal.toFixed(2), currencyCode: currency };
  next = {
    ...next,
    totalQuantity: next.lines.nodes.reduce((n, l) => n + l.quantity, 0),
    cost: { subtotalAmount: money, totalAmount: money },
  };
  return next;
}

export function CartProvider({
  cartPromise,
  children,
}: {
  cartPromise: Promise<Cart | null>;
  children: ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  // Close the drawer whenever the route changes.
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [ops, addOp] = useOptimistic<CartOp[], CartOp>([], (state, op) => [...state, op]);

  const run = useCallback(
    (op: CartOp, action: () => Promise<CartActionResult>, onSuccess?: (cart: Cart) => void) => {
      setError(null);
      startTransition(async () => {
        addOp(op);
        const result = await action();
        if (!result.ok) setError(result.message);
        else onSuccess?.(result.cart);
        // Server Actions call refresh(), so the layout re-renders with a fresh
        // cart promise in this same transition and the optimistic ops drop.
      });
    },
    [addOp],
  );

  const addItem = useCallback(
    (item: AddItemInput) => {
      setOpen(true);
      run({ type: "add", item }, () => addToCartAction(item.merchandiseId, item.quantity ?? 1), (cart) =>
        trackAddToCart(cart, item),
      );
    },
    [run],
  );

  const updateLine = useCallback(
    (lineId: string, quantity: number) =>
      run({ type: "update", lineId, quantity }, () => updateLineAction(lineId, quantity)),
    [run],
  );

  const removeLine = useCallback(
    (lineId: string) => run({ type: "remove", lineId }, () => removeLineAction(lineId)),
    [run],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cartPromise,
      ops,
      isOpen,
      setOpen,
      pending,
      error,
      clearError: () => setError(null),
      addItem,
      updateLine,
      removeLine,
    }),
    [cartPromise, ops, isOpen, pending, error, addItem, updateLine, removeLine],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside <CartProvider>");
  return ctx;
}

/**
 * The cart with optimistic updates applied. Suspends until the server cart
 * resolves, so render it inside <Suspense>.
 */
export function useCart(): Cart | null {
  const { cartPromise, ops } = useCartContext();
  const cart = use(cartPromise);
  return useMemo(() => applyOps(cart, ops), [cart, ops]);
}
