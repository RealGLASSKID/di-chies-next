"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { lines, subtotal, setQuantity, removeItem, clear,} = useCart();
  const { isAdmin } = useAuth();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
  });

  // Prefill name/phone from profile once (so state matches what the user sees)
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || profile.full_name || "",
      phone: prev.phone || profile.phone || "",
    }));
  }, [profile]);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      toast.error("Please sign in to complete your booking.");
      router.push("/login");
      return;
    }

    // Read straight from the DOM instead of React state. Native
    // <input type="date"> / <input type="time"> can visually show a value
    // (picker selection, autofill, some mobile keyboards) without their
    // onChange having fired, which left form.date/form.time stuck at "".
    // FormData always reflects what's actually in the fields right now.
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const time = String(formData.get("time") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!name || !phone || !date || !time) {
      toast.error("Name, phone, collection date and time are required.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          customer_name: name.slice(0, 120),
          customer_phone: phone.slice(0, 30),
          customer_email: user.email ?? "",
          notes: [`Collection: ${date} ${time}`, notes]
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
      toast.error(
        error instanceof Error ? error.message : "Could not create your booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isAdmin) {
    return (
      <SiteLayout>
        <PageHeader
          eyebrow="Cart"
          title="Not available for admins"
          description="You're signed in as the store admin — bookings are for customers only."
        />
        <div className="container-page py-12">
          <EmptyState
            icon={<ShoppingBasket className="size-8" aria-hidden />}
            title="Nothing to book here"
            description="Manage products, categories and customer bookings from the admin console instead."
            action={
              <Button asChild>
                <Link href="/admin">Go to admin console</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  if (lines.length === 0) {
    return (
      <SiteLayout>
        <PageHeader
          eyebrow="Cart"
          title="Your basket"
          description="Reserve items for collection at DI CHIES."
        />
        <div className="container-page py-12">
          <EmptyState
            icon={<ShoppingBasket className="size-8" aria-hidden />}
            title="Your cart is empty"
            description="Browse the shop and add products to reserve them for collection."
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
        eyebrow="Cart"
        title="Your basket"
        description="Review items and book a collection slot."
      />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {lines.map((line) => (
            <div
              key={line.product.id}
              className="flex gap-4 rounded-md border border-border p-4"
            >
              <div className="size-20 shrink-0 overflow-hidden rounded-md border border-border">
                <ProductImage
                  src={line.product.image_url}
                  alt={line.product.name}
                  className="size-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{line.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {line.product.brand}
                  {line.product.unit ? ` · per ${line.product.unit}` : ""}
                </p>
                <p className="mt-1 font-semibold">
                  {formatNaira(effectivePrice(line.product) * line.quantity)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-md border border-border">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() =>
                        setQuantity(line.product.id, Math.max(0, line.quantity - 1))
                      }
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() =>
                        setQuantity(line.product.id, line.quantity + 1)
                      }
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeItem(line.product.id)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={submitBooking}
          className="h-fit rounded-md border border-border p-6"
        >
          <h2 className="font-display text-lg font-bold">Collection details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Subtotal {formatNaira(subtotal)}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="booking-name">Full name</Label>
              <Input
                id="booking-name"
                name="name"
                required
                maxLength={120}
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="booking-phone">Phone number</Label>
              <Input
                id="booking-phone"
                name="phone"
                required
                maxLength={30}
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="booking-date">Date</Label>
                <Input
                  id="booking-date"
                  name="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="booking-time">Time</Label>
                <Input
                  id="booking-time"
                  name="time"
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="booking-notes">Notes (optional)</Label>
              <Textarea
                id="booking-notes"
                name="notes"
                maxLength={500}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? "Booking…" : "Confirm booking"}
          </Button>
          {!user && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You&apos;ll need to{" "}
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