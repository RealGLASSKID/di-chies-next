"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BOOKING_STATUSES,
  formatDate,
  formatNaira,
  statusLabels,
  type BookingStatus,
} from "@/lib/format";

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();

  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [products, categories] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      return { products: products.count ?? 0, categories: categories.count ?? 0 };
    },
  });

  async function updateStatus(id: string, status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    toast.success("Booking updated.");
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-sm text-muted-foreground">Checking access…</div>
      </SiteLayout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <SiteLayout>
        <div className="container-page py-20">
          <EmptyState
            title="Admin access required"
            description="Sign in with a DI CHIES staff account to open the console."
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
      <PageHeader eyebrow="Staff" title="Admin console" description="Bookings and catalogue overview." />
      <div className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-border p-5">
            <p className="eyebrow">Bookings</p>
            <p className="mt-1 text-2xl font-semibold">{bookings.data?.length ?? 0}</p>
          </div>
          <div className="rounded-md border border-border p-5">
            <p className="eyebrow">Products</p>
            <p className="mt-1 text-2xl font-semibold">{stats.data?.products ?? 0}</p>
          </div>
          <div className="rounded-md border border-border p-5">
            <p className="eyebrow">Departments</p>
            <p className="mt-1 text-2xl font-semibold">{stats.data?.categories ?? 0}</p>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.data?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-semibold">{booking.reference}</TableCell>
                  <TableCell>
                    {booking.customer_name}
                    <span className="block text-xs text-muted-foreground">{booking.customer_phone}</span>
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.created_at)}
                    <span className="block text-xs text-muted-foreground">
                      {booking.item_count} items
                    </span>
                  </TableCell>
                  <TableCell>{formatNaira(booking.total)}</TableCell>
                  <TableCell>
                    <Select
                      value={booking.status}
                      onValueChange={(value) => void updateStatus(booking.id, value as BookingStatus)}
                    >
                      <SelectTrigger className="w-48" aria-label="Booking status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOOKING_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SiteLayout>
  );
}


export default AdminPage;
