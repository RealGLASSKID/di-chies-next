"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNaira, statusLabels, type BookingStatus } from "@/lib/format";

function BookingsPage() {
  const { user } = useAuth();
  const { data: bookings, isPending } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, booking_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteLayout>
      <PageHeader eyebrow="Account" title="My bookings" description="Collection only — pay in store." />
      <div className="container-page py-12">
        {!user && (
          <EmptyState
            title="Sign in to see your bookings"
            action={
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            }
          />
        )}
        {user && isPending && <p className="text-sm text-muted-foreground">Loading bookings…</p>}
        {user && !isPending && !bookings?.length && (
          <EmptyState
            icon={<ClipboardList className="size-8" aria-hidden />}
            title="No bookings yet"
            description="Reserve a basket and it will appear here with its collection reference."
            action={
              <Button asChild>
                <Link href="/shop">Start shopping</Link>
              </Button>
            }
          />
        )}
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <article key={booking.id} className="rounded-md border border-border p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">{booking.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    Booked {formatDate(booking.created_at)} · {booking.item_count} item
                    {booking.item_count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {statusLabels[booking.status as BookingStatus] ?? booking.status}
                  </Badge>
                  <span className="text-sm font-semibold">{formatNaira(booking.total)}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {booking.booking_items?.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.product_name} — {formatNaira(item.subtotal)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}


export default BookingsPage;
