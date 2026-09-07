"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Package,
  History,
  StickyNote,
  Loader2,
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

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
  admin_notes: string | null;
  status: BookingStatus;
  total: number;
  item_count: number;
  created_at: string;
  updated_at: string;
  booking_items: BookingItem[] | null;
};

type HistoryRow = {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
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

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [adminNotesDraft, setAdminNotesDraft] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusNote, setStatusNote] = useState("");

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

  const history = useQuery({
    queryKey: ["admin-booking-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_status_history")
        .select("*")
        .eq("booking_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  async function updateStatus(status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Optional extra note on the latest history row
    if (statusNote.trim()) {
      const { data: latest } = await supabase
        .from("booking_status_history")
        .select("id")
        .eq("booking_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.id) {
        await supabase
          .from("booking_status_history")
          .update({ note: statusNote.trim() })
          .eq("id", latest.id);
      }
      setStatusNote("");
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-booking", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-booking-history", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    toast.success(`Status set to ${statusLabels[status]}`);
  }

  async function saveAdminNotes() {
    if (adminNotesDraft === null) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("bookings")
      .update({ admin_notes: adminNotesDraft })
      .eq("id", id);
    setSavingNotes(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-booking", id] });
    setAdminNotesDraft(null);
    toast.success("Admin notes saved");
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
  const notesValue = adminNotesDraft ?? b.admin_notes ?? "";
  const historyRows = history.data ?? [];

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
              <Badge className={cn("text-sm", statusBadgeClass(b.status))}>
                {statusLabels[b.status] ?? b.status}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated {formatDateTime(b.updated_at)}
            </p>
            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Optional note for this status change
              </label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Customer called — items packed"
                rows={2}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Saved onto the timeline when you change status above.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="size-4" />
              Customer notes
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm">
              {b.notes?.trim() || "No notes from customer."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Collection date/time is often stored in notes when the customer booked.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <StickyNote className="size-4" />
              Admin notes (internal)
            </h2>
            <Textarea
              value={notesValue}
              onChange={(e) => setAdminNotesDraft(e.target.value)}
              placeholder="Staff-only notes — not shown to the customer"
              rows={4}
              className="mt-3 text-sm"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                disabled={adminNotesDraft === null || savingNotes}
                onClick={() => void saveAdminNotes()}
              >
                {savingNotes && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Save notes
              </Button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Status timeline */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="size-4" />
              Status history
            </h2>
            {history.isLoading && (
              <p className="text-sm text-muted-foreground">Loading timeline…</p>
            )}
            {!history.isLoading && historyRows.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No history yet. Change the status above to start the timeline.
              </p>
            )}
            {historyRows.length > 0 && (
              <ol className="relative space-y-0 border-l border-border ml-2">
                {historyRows.map((row, idx) => {
                  const isLast = idx === historyRows.length - 1;
                  return (
                    <li key={row.id} className="relative pb-6 pl-6 last:pb-0">
                      <span
                        className={cn(
                          "absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-background",
                          isLast ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", statusBadgeClass(row.to_status))}
                        >
                          {statusLabels[row.to_status] ?? row.to_status}
                        </Badge>
                        {row.from_status && (
                          <span className="text-xs text-muted-foreground">
                            from {statusLabels[row.from_status] ?? row.from_status}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(row.created_at)}
                      </p>
                      {row.note?.trim() && (
                        <p className="mt-1 text-sm text-foreground/90">{row.note}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Line items */}
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Package className="size-4" />
              Items ({items.length})
            </h2>
            {items.length === 0 ? (
              <EmptyState title="No items" description="This booking has no line items." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12" />
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit</TableHead>
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

          <p className="text-xs text-muted-foreground">
            Flow: Pending → Confirmed → Preparing → Ready for Collection → Collected.
            Every status change is recorded in the timeline above.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
