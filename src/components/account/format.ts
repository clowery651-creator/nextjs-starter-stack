import type { Money } from "@/lib/customer-account/api";

export function formatMoney(m: Money | null | undefined): string {
  if (!m) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currencyCode }).format(Number(m.amount));
  } catch {
    return `${m.amount} ${m.currencyCode}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Los_Angeles" }).format(new Date(iso));
}

/** UNFULFILLED → "Unfulfilled", PARTIALLY_REFUNDED → "Partially refunded". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const s = value.toLowerCase().replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
