"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Package,
  FolderTree,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

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

const LOW_STOCK_THRESHOLD = 5;

export default function AdminDashboardPage() {
  const stats = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [products, categories, bookings, pending, lowStock] =
        await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("bookings").select("id", { count: "exact", head: true }),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .lte("stock_quantity", LOW_STOCK_THRESHOLD)
            .eq("is_available", true),
        ]);
      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        bookings: bookings.count ?? 0,
        pending: pending.count ?? 0,
        lowStock: lowStock.count ?? 0,
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

  const lowStockItems = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,sku,stock_quantity,image_url")
        .lte("stock_quantity", LOW_STOCK_THRESHOLD)
        .eq("is_available", true)
        .order("stock_quantity", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data ?? [];
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
      href: "/admin/bookings?status=pending",
    },
    {
      label: "Low stock",
      value: stats.data?.lowStock ?? "—",
      icon: AlertTriangle,
      href: "/admin/products?stock=low",
      warn: (stats.data?.lowStock ?? 0) > 0,
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card
                className={
                  card.warn
                    ? "border-amber-300 transition-colors hover:border-amber-500 dark:border-amber-800"
                    : "transition-colors hover:border-primary/40"
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <Icon
                    className={
                      card.warn
                        ? "size-4 text-amber-600"
                        : "size-4 text-muted-foreground"
                    }
                  />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.warn && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      ≤ {LOW_STOCK_THRESHOLD} units
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
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
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="hover:underline"
                      >
                        {b.reference || "—"}
                      </Link>
                    </TableCell>
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

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="size-4 text-amber-600" />
              Low stock
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products?stock=low">Manage stock</Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!lowStockItems.isLoading &&
                  (lowStockItems.data?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        All stocked products are above {LOW_STOCK_THRESHOLD} units.
                      </TableCell>
                    </TableRow>
                  )}
                {lowStockItems.data?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.sku || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={
                          p.stock_quantity <= 0
                            ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        }
                      >
                        {p.stock_quantity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
