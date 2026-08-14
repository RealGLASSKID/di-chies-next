"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, FolderTree, ClipboardList, TrendingUp } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  formatDate,
  formatNaira,
  statusLabels,
  type BookingStatus,
} from "@/lib/format";

export default function AdminDashboardPage() {
  const stats = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [products, categories, bookings, pending] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        bookings: bookings.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    {
      label: "Products",
      value: stats.data?.products ?? "—",
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Categories",
      value: stats.data?.categories ?? "—",
      icon: FolderTree,
      href: "/admin/categories",
    },
    {
      label: "Total bookings",
      value: stats.data?.bookings ?? "—",
      icon: ClipboardList,
      href: "/admin/bookings",
    },
    {
      label: "Pending",
      value: stats.data?.pending ?? "—",
      icon: TrendingUp,
      href: "/admin/bookings",
    },
  ];

  return (
    <AdminShell
      title="Dashboard"
      description="Overview of catalogue and bookings."
      actions={
        <Button asChild size="sm">
          <Link href="/admin/products">Add product</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent bookings</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/bookings">View all</Link>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!recent.isLoading && (recent.data?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No bookings yet.
                  </TableCell>
                </TableRow>
              )}
              {recent.data?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.reference || "—"}</TableCell>
                  <TableCell>
                    {b.customer_name}
                    <span className="block text-xs text-muted-foreground">
                      {b.customer_phone}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(b.created_at)}</TableCell>
                  <TableCell>{formatNaira(b.total)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {statusLabels[b.status as BookingStatus] ?? b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}