"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Phone, Mail, FileText, Package } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/ui/empty-state";
import { supabase } from "@/integrations/supabase/client";
import {
  BOOKING_STATUSES,
  formatDateTime,
  formatNaira,
  statusLabels,
  type BookingStatus,
} from "@/lib/format";

type BookingItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit: string;
};

type BookingRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  status: BookingStatus;
  total: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  booking_items: BookingItem[] | null;
};

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const booking = useQuery({
    queryKey: ["admin-booking", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, booking_items(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as BookingRow;
    },
  });

  async function updateStatus(status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-booking", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    toast.success(`Status set to ${statusLabels[status]}`);
  }

  if (booking.isLoading) {
    return (
      <AdminShell title="Booking" description="Loading…">
        <p className="text-sm text-muted-foreground">Loading booking details…</p>
      </AdminShell>
    );
  }

  if (booking.isError || !booking.data) {
    return (
      <AdminShell title="Booking" description="Not found">
        <EmptyState
          title="Booking not found"
          description="This booking may have been removed."
          action={
            <Button asChild variant="outline">
              <Link href="/admin/bookings">
                <ArrowLeft className="mr-2 size-4" />
                Back to bookings
              </Link>
            </Button>
          }
        />
      </AdminShell>
    );
  }

  const b = booking.data;
  const items = b.booking_items ?? [];
  const itemsTotal = items.reduce((sum, row) => sum + Number(row.subtotal), 0);

  return (
    <AdminShell
      title={b.reference || "Booking"}
      description={`Placed ${formatDateTime(b.created_at)} · ${b.item_count} item${b.item_count === 1 ? "" : "s"}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft className="mr-1.5 size-4" />
              All bookings
            </Link>
          </Button>
          <Select
            value={b.status}
            onValueChange={(v) => void updateStatus(v as BookingStatus)}
          >
            <SelectTrigger className="w-52">
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
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h2>
            <p className="mt-3 text-lg font-semibold">{b.customer_name || "—"}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <span>{b.customer_phone || "No phone"}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <span className="break-all">{b.customer_email || "No email"}</span>
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </h2>
            <div className="mt-3">
              <Badge variant="secondary" className="text-sm">
                {statusLabels[b.status] ?? b.status}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated {formatDateTime(b.updated_at)}
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="size-4" />
              Notes
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm">
              {b.notes?.trim() || "No notes from customer."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Collection date/time is often stored in notes when the customer booked.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Totals
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Line items</dt>
                <dd>{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Units</dt>
                <dd>{b.item_count}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Order total</dt>
                <dd>{formatNaira(Number(b.total))}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="lg:col-span-2">
          <section className="rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Package className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Order items</h2>
              <span className="text-sm text-muted-foreground">
                ({items.length} line{items.length === 1 ? "" : "s"})
              </span>
            </div>

            {items.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No line items found for this booking.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="size-10 overflow-hidden rounded-md border border-border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                item.product_image ||
                                "https://placehold.co/80x80/e4e4e7/18181b?text=—"
                              }
                              alt=""
                              className="size-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">
                            per {item.unit || "unit"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNaira(Number(item.unit_price))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNaira(Number(item.subtotal))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-semibold">
                        Items total
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNaira(itemsTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <p className="mt-4 text-xs text-muted-foreground">
            Use the status dropdown above as you process the order: Pending → Confirmed →
            Preparing → Ready for Collection → Collected.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}