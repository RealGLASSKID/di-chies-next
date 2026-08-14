export function formatNaira(value: number | string | null | undefined): string {
  const amount = typeof value === "string" ? Number(value) : (value ?? 0);
  return `₦${Number.isFinite(amount) ? amount.toLocaleString("en-NG", { maximumFractionDigits: 0 }) : "0"}`;
}

export function effectivePrice(product: {
  price: number | string;
  discount_price?: number | string | null;
}): number {
  const price = Number(product.price);
  const discount = product.discount_price == null ? null : Number(product.discount_price);
  return discount != null && discount > 0 && discount < price ? discount : price;
}

export function discountPercent(product: {
  price: number | string;
  discount_price?: number | string | null;
}): number | null {
  const price = Number(product.price);
  const discount = product.discount_price == null ? null : Number(product.discount_price);
  if (discount == null || discount <= 0 || discount >= price) return null;
  return Math.round(((price - discount) / price) * 100);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return `${formatDate(date)}, ${date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
}

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_collection",
  "collected",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_collection: "Ready for Collection",
  collected: "Collected",
  cancelled: "Cancelled",
};