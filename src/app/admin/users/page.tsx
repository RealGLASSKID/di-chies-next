"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");

      const roleMap = new Map<string, { id: string; role: string }[]>();
      for (const r of roles ?? []) {
        const list = roleMap.get(r.user_id) ?? [];
        list.push({ id: r.id, role: r.role });
        roleMap.set(r.user_id, list);
      }

      return (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
      }));
    },
  });

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

  return (
    <AdminShell
      title="Users"
      description="Manage accounts and staff access."
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {users.data?.map((u) => {
              const isAdmin = u.roles.some((r) => r.role === "admin");
              const adminRole = u.roles.find((r) => r.role === "admin");
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name || "—"}
                    {u.id === me?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {isAdmin ? (
                      <Badge>admin</Badge>
                    ) : (
                      <Badge variant="secondary">customer</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin && adminRole ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={u.id === me?.id}
                        onClick={() => void removeAdmin(adminRole.id, u.id)}
                      >
                        Remove admin
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => void makeAdmin(u.id)}>
                        Make admin
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}