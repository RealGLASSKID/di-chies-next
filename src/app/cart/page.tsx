"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductImage } from "@/components/ui/product-image";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { effectivePrice, formatNaira } from "@/lib/format";

function CartPage() {
  const { lines, subtotal, setQuantity, removeItem, clear } = useCart();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", notes: "" });

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      toast.error("Please sign in to complete your booking.");
      router.push("/login");
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time) {
      toast.error("Name, phone, collection date and time are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          customer_name: form.name.trim().slice(0, 120),
          customer_phone: form.phone.trim().slice(0, 30),
          customer_email: user.email ?? "",
          notes: [`Collection: ${form.date} ${form.time}`, form.notes.trim()]
            .filter(Boolean)
            .join(" — ")
            .slice(0, 500),
          item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
          total: subtotal,
        })
        .select("id,reference")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("booking_items").insert(
        lines.map((line) => ({
          booking_id: booking.id,
          product_id: line.product.id,
          product_name: line.product.name,
          product_image: line.product.image_url,
          unit: line.product.unit,
          quantity: line.quantity,
          unit_price: effectivePrice(line.product),
          subtotal: effectivePrice(line.product) * line.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      toast.success(`Booking ${booking.reference} confirmed.`);
      router.push("/account/bookings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Booking" title="Your basket" />
        <div className="container-page py-16">
          <EmptyState
            icon={<ShoppingBasket className="size-8" aria-hidden />}
            title="Your basket is empty"
            description="Add products from any department and they'll appear here, ready to reserve."
            action={
              <Button asChild>
                <Link href="/shop">Start shopping</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Booking"
        title="Your basket"
        description="Collection only — choose a slot and pay at the DI CHIES collection desk."
      />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-border rounded-md border border-border">
          {lines.map((line) => (
            <li key={line.product.id} className="flex gap-4 p-4">
              <ProductImage
                src={line.product.image_url}
                alt={line.product.name}
                className="size-24 shrink-0 rounded-sm"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">
                      <Link href={`/products/${line.product.slug }`} className="hover:underline">
                        {line.product.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {line.product.brand} · per {line.product.unit}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatNaira(effectivePrice(line.product) * line.quantity)}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center rounded-md border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Decrease ${line.product.name}`}
                      onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                    >
                      <Minus className="size-4" aria-hidden />
                    </Button>
                    <span className="w-9 text-center text-sm font-semibold">{line.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Increase ${line.product.name}`}
                      onClick={() => setQuantity(line.product.id, line.quantity + 1)}
                    >
                      <Plus className="size-4" aria-hidden />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(line.product.id)}
                    aria-label={`Remove ${line.product.name}`}
                  >
                    <Trash2 className="mr-1 size-4" aria-hidden />
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={submitBooking} className="h-fit rounded-md border border-border p-6">
          <h2 className="text-lg font-semibold">Collection details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Subtotal {formatNaira(subtotal)}</p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="booking-name">Full name</Label>
              <Input
                id="booking-name"
                required
                maxLength={120}
                value={form.name || profile?.full_name || ""}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="booking-phone">Phone number</Label>
              <Input
                id="booking-phone"
                required
                maxLength={30}
                value={form.phone || profile?.phone || ""}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="booking-date">Date</Label>
                <Input
                  id="booking-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="booking-time">Time</Label>
                <Input
                  id="booking-time"
                  type="time"
                  required
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="booking-notes">Notes (optional)</Label>
              <Textarea
                id="booking-notes"
                maxLength={500}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? "Booking…" : "Confirm booking"}
          </Button>
          {!user && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You'll need to{" "}
              <Link href="/login" className="font-semibold underline">
                sign in
              </Link>{" "}
              to confirm.
            </p>
          )}
        </form>
      </div>
    </SiteLayout>
  );
}


export default CartPage;
