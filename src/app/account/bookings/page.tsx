"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Package, History } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDateTime,
  formatNaira,
  statusLabels,
  type BookingStatus,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type BookingListItem = {
  id: string;
  reference: string;
  status: BookingStatus;
  total: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  notes: string;
};

type HistoryRow = {
  id: string;
  to_status: BookingStatus;
  from_status: BookingStatus | null;
  note: string;
  created_at: string;
};

function statusBadgeClass(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "confirmed":
      return "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200";
    case "preparing":
      return "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200";
    case "ready_for_collection":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    case "collected":
      return "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200";
    case "cancelled":
      return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";
    default:
      return "";
  }
}

function BookingCard({ booking }: { booking: BookingListItem }) {
  const history = useQuery({
    queryKey: ["my-booking-history", booking.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_status_history")
        .select("id,to_status,from_status,note,created_at")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  const steps = history.data ?? [];

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{booking.reference || "Booking"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Placed {formatDateTime(booking.created_at)}
          </p>
        </div>
        <Badge className={cn("text-sm", statusBadgeClass(booking.status))}>
          {statusLabels[booking.status] ?? booking.status}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <span className="text-muted-foreground">
          {booking.item_count} item{booking.item_count === 1 ? "" : "s"}
        </span>
        <span className="font-medium">{formatNaira(Number(booking.total))}</span>
      </div>

      {booking.notes?.trim() && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Your notes: </span>
          {booking.notes}
        </p>
      )}

      {/* Mini timeline */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="size-3.5" />
          Status timeline
        </p>
        {history.isLoading && (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}
        {!history.isLoading && steps.length === 0 && (
          <p className="text-xs text-muted-foreground">Status will appear here as we process your order.</p>
        )}
        {steps.length > 0 && (
          <ol className="relative ml-1.5 space-y-0 border-l border-border">
            {steps.map((row, idx) => {
              const isLast = idx === steps.length - 1;
              return (
                <li key={row.id} className="relative pb-4 pl-5 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-1 top-1 size-2.5 rounded-full border-2 border-background",
                      isLast ? "bg-primary" : "bg-muted-foreground/40",
                    )}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {statusLabels[row.to_status] ?? row.to_status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(row.created_at)}
                    </span>
                  </div>
                  {row.note?.trim() && row.note !== "Booking created" && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </article>
  );
}

export default function AccountBookingsPage() {
  const { user, loading: authLoading } = useAuth();

  const bookings = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id,reference,status,total,item_count,created_at,updated_at,notes")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingListItem[];
    },
  });

  if (authLoading) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Account" title="My bookings" />
        <div className="container-page py-12 text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Account" title="My bookings" />
        <div className="container-page py-12">
          <EmptyState
            title="Sign in to view bookings"
            description="Your collection orders appear here once you are signed in."
            action={
              <Button asChild>
                <Link href="/login">Sign in</Link>
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
        eyebrow="Account"
        title="My bookings"
        description="Track the status of your collection orders."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/account">
              Back to account
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
        }
      />
      <div className="container-page py-10">
        {bookings.isLoading && (
          <p className="text-sm text-muted-foreground">Loading your bookings…</p>
        )}
        {bookings.isError && (
          <p className="text-sm text-destructive">
            Could not load bookings. Please try again.
          </p>
        )}
        {!bookings.isLoading && (bookings.data?.length ?? 0) === 0 && (
          <EmptyState
            title="No bookings yet"
            description="When you place a collection order, it will show up here with a live status timeline."
            action={
              <Button asChild>
                <Link href="/shop">
                  <Package className="mr-2 size-4" />
                  Browse shop
                </Link>
              </Button>
            }
          />
        )}
        <div className="grid gap-4">
          {bookings.data?.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
