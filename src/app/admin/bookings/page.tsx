"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  BOOKING_STATUSES,
  formatDateTime,
  formatNaira,
  statusLabels,
  type BookingStatus,
} from "@/lib/format";

function AdminBookingsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const userFilter = searchParams.get("user");
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const bookings = useQuery({
    queryKey: ["admin-bookings", filter, userFilter],
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (filter !== "all") q = q.eq("status", filter as BookingStatus);
      if (userFilter) q = q.eq("user_id", userFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  async function updateStatus(id: string, status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    toast.success("Booking updated");
  }

  return (
    <AdminShell
      title="Bookings"
      description={
        userFilter
          ? "Showing bookings for one user. Clear the filter in the URL or open Bookings from the sidebar for all."
          : "Click View to open full order details and line items."
      }
      actions={
        <div className="flex items-center gap-2">
          {userFilter && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/bookings">Clear user filter</Link>
            </Button>
          )}
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as BookingStatus | "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!bookings.isLoading && (bookings.data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}
            {bookings.data?.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-semibold">
                  <Link href={`/admin/bookings/${b.id}`} className="hover:underline">
                    {b.reference || "—"}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>{b.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{b.customer_email}</div>
                  <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(b.created_at)}
                </TableCell>
                <TableCell>{b.item_count}</TableCell>
                <TableCell>{formatNaira(Number(b.total))}</TableCell>
                <TableCell>
                  <Select
                    value={b.status}
                    onValueChange={(v) => void updateStatus(b.id, v as BookingStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOKING_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabels[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/bookings/${b.id}`}>
                      <Eye className="mr-1.5 size-4" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Bookings" description="Loading…">
          <p className="text-sm text-muted-foreground">Loading bookings…</p>
        </AdminShell>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}