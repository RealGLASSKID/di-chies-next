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

/** Price after applying a promotion percentage (takes the better of product discount vs promo). */
export function priceWithPromo(
  product: { price: number | string; discount_price?: number | string | null },
  promoPercent: number | null | undefined,
): number {
  const base = effectivePrice(product);
  if (promoPercent == null || promoPercent <= 0) return base;
  const fromPromo = Number(product.price) * (1 - Number(promoPercent) / 100);
  if (!Number.isFinite(fromPromo) || fromPromo <= 0) return base;
  return Math.min(base, fromPromo);
}

/** Display % off when a promo is applied (uses the better deal). */
export function discountPercentWithPromo(
  product: { price: number | string; discount_price?: number | string | null },
  promoPercent: number | null | undefined,
): number | null {
  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const final = priceWithPromo(product, promoPercent);
  if (final >= price) return null;
  return Math.round(((price - final) / price) * 100);
}

/** Live = active flag on and within start/end window. */
export function isPromotionLive(promo: {
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}): boolean {
  if (!promo.is_active) return false;
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return false;
  if (promo.ends_at && new Date(promo.ends_at).getTime() <= now) return false;
  return true;
}

export function isPromotionEnded(promo: { ends_at?: string | null }): boolean {
  if (!promo.ends_at) return false;
  return new Date(promo.ends_at).getTime() <= Date.now();
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