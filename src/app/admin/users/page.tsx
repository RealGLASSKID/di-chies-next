"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoreHorizontal,
  ShoppingCart,
  Trash2,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Eye,
  ClipboardList,
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNaira, effectivePrice } from "@/lib/format";
import { PRODUCT_FIELDS } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";
import type { Product } from "@/types/catalog";

type RoleRow = { id: string; role: string };

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  roles: RoleRow[];
  cart_count: number;
  booking_count: number;
};

type CartLine = {
  product_id: string;
  quantity: number;
  product: Product | null;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [cartUser, setCartUser] = useState<AdminUser | null>(null);

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");

      const roleMap = new Map<string, RoleRow[]>();
      for (const r of roles ?? []) {
        const list = roleMap.get(r.user_id) ?? [];
        list.push({ id: r.id, role: r.role });
        roleMap.set(r.user_id, list);
      }

      // Cart counts per user
      const { data: cartRows } = await supabase
        .from("cart_items")
        .select("user_id, quantity");
      const cartCountMap = new Map<string, number>();
      for (const row of cartRows ?? []) {
        cartCountMap.set(
          row.user_id,
          (cartCountMap.get(row.user_id) ?? 0) + (row.quantity ?? 0),
        );
      }

      // Booking counts per user
      const { data: bookingRows } = await supabase.from("bookings").select("user_id");
      const bookingCountMap = new Map<string, number>();
      for (const row of bookingRows ?? []) {
        bookingCountMap.set(row.user_id, (bookingCountMap.get(row.user_id) ?? 0) + 1);
      }

      return (profiles ?? []).map((p) => ({
        ...p,
        is_active: p.is_active !== false,
        roles: roleMap.get(p.id) ?? [],
        cart_count: cartCountMap.get(p.id) ?? 0,
        booking_count: bookingCountMap.get(p.id) ?? 0,
      }));
    },
  });

  const cartQuery = useQuery({
    queryKey: ["admin-user-cart", cartUser?.id],
    enabled: !!cartUser?.id,
    queryFn: async (): Promise<CartLine[]> => {
      if (!cartUser) return [];
      const { data: items, error } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", cartUser.id);
      if (error) throw error;
      if (!items?.length) return [];

      const productIds = items.map((i) => i.product_id);
      const { data: products } = await supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .in("id", productIds);

      const productMap = new Map((products ?? []).map((p) => [p.id, p as Product]));
      return items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        product: productMap.get(i.product_id) ?? null,
      }));
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.data ?? [];
    return (users.data ?? []).filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q),
    );
  }, [users.data, search]);

  async function makeAdmin(userId: string) {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User promoted to admin");
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function removeAdmin(roleId: string, userId: string) {
    if (userId === me?.id) {
      toast.error("You cannot remove your own admin role");
      return;
    }
    if (!confirm("Remove admin access for this user?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Admin role removed");
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function setActive(userId: string, active: boolean) {
    if (userId === me?.id && !active) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    const label = active ? "reactivate" : "deactivate";
    if (!confirm(`Are you sure you want to ${label} this user?`)) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: active })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(active ? "User reactivated" : "User deactivated");
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function clearCart(userId: string, name: string) {
    if (!confirm(`Clear the entire cart for ${name || "this user"}?`)) return;
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cart cleared");
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    if (cartUser?.id === userId) {
      await queryClient.invalidateQueries({ queryKey: ["admin-user-cart", userId] });
    }
  }

  async function removeCartItem(userId: string, productId: string) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Item removed from cart");
    await queryClient.invalidateQueries({ queryKey: ["admin-user-cart", userId] });
    await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  const cartSubtotal = useMemo(() => {
    return (cartQuery.data ?? []).reduce((sum, line) => {
      if (!line.product) return sum;
      return sum + effectivePrice(line.product) * line.quantity;
    }, 0);
  }, [cartQuery.data]);

  return (
    <AdminShell
      title="Users"
      description="Manage accounts, roles, carts, and staff access."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-muted-foreground">
          {filtered.length} user{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cart</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!users.isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => {
              const isAdmin = u.roles.some((r) => r.role === "admin");
              const adminRole = u.roles.find((r) => r.role === "admin");
              const isMe = u.id === me?.id;
              return (
                <TableRow key={u.id} className={!u.is_active ? "opacity-60" : undefined}>
                  <TableCell className="font-medium">
                    {u.full_name || "—"}
                    {isMe && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {isAdmin ? (
                      <Badge>admin</Badge>
                    ) : (
                      <Badge variant="secondary">customer</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <Badge variant="outline" className="border-emerald-600/40 text-emerald-600">
                        active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.cart_count > 0 ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        onClick={() => setCartUser(u)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {u.cart_count}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.booking_count > 0 ? (
                      <Link
                        href={`/admin/bookings?user=${u.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {u.booking_count}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setCartUser(u)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View cart
                        </DropdownMenuItem>
                        {u.cart_count > 0 && (
                          <DropdownMenuItem
                            onClick={() => void clearCart(u.id, u.full_name || u.email)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear cart
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/bookings?user=${u.id}`}>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            View bookings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isAdmin && adminRole ? (
                          <DropdownMenuItem
                            disabled={isMe}
                            onClick={() => void removeAdmin(adminRole.id, u.id)}
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Remove admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => void makeAdmin(u.id)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make admin
                          </DropdownMenuItem>
                        )}
                        {u.is_active ? (
                          <DropdownMenuItem
                            disabled={isMe}
                            className="text-destructive focus:text-destructive"
                            onClick={() => void setActive(u.id, false)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => void setActive(u.id, true)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Cart detail dialog */}
      <Dialog open={!!cartUser} onOpenChange={(open) => !open && setCartUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Cart — {cartUser?.full_name || cartUser?.email || "User"}
            </DialogTitle>
            <DialogDescription>
              Items currently in this customer&apos;s basket.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto py-2">
            {cartQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading cart…</p>
            )}
            {!cartQuery.isLoading && (cartQuery.data?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Cart is empty.</p>
            )}
            {(cartQuery.data ?? []).map((line) => (
              <div
                key={line.product_id}
                className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {line.product?.name ?? "Unknown product"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty {line.quantity}
                    {line.product && (
                      <>
                        {" · "}
                        {formatNaira(effectivePrice(line.product))} each
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {line.product && (
                    <span className="text-sm font-medium">
                      {formatNaira(effectivePrice(line.product) * line.quantity)}
                    </span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    title="Remove from cart"
                    onClick={() =>
                      cartUser && void removeCartItem(cartUser.id, line.product_id)
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {(cartQuery.data?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatNaira(cartSubtotal)}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {(cartQuery.data?.length ?? 0) > 0 && cartUser && (
              <Button
                variant="destructive"
                onClick={() =>
                  void clearCart(cartUser.id, cartUser.full_name || cartUser.email)
                }
              >
                Clear entire cart
              </Button>
            )}
            <Button variant="outline" onClick={() => setCartUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
