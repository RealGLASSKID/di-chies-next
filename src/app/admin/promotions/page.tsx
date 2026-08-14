"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

type PromoRow = {
  id: string;
  title: string;
  description: string;
  discount_percent: number;
  image_url: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
};

const emptyForm = {
  title: "",
  description: "",
  discount_percent: "10",
  image_url: "",
  is_active: true,
  ends_at: "",
};

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const promos = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoRow[];
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: PromoRow) {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description ?? "",
      discount_percent: String(p.discount_percent ?? 0),
      image_url: p.image_url ?? "",
      is_active: p.is_active,
      ends_at: p.ends_at ? p.ends_at.slice(0, 10) : "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      discount_percent: Number(form.discount_percent) || 0,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    const { error } = editing
      ? await supabase.from("promotions").update(payload).eq("id", editing.id)
      : await supabase.from("promotions").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Promotion updated" : "Promotion created");
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete promotion “${title}”?`)) return;
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Promotion deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
  }

  return (
    <AdminShell
      title="Promotions"
      description="Homepage and deals banners with discount highlights."
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Add promotion
        </Button>
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Ends</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!promos.isLoading && (promos.data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No promotions yet.
                </TableCell>
              </TableRow>
            )}
            {promos.data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="size-10 overflow-hidden rounded-md border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        p.image_url ||
                        "https://placehold.co/80x80/e4e4e7/18181b?text=—"
                      }
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{p.title}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {p.description}
                  </div>
                </TableCell>
                <TableCell>{Number(p.discount_percent)}%</TableCell>
                <TableCell className="text-sm">
                  {p.ends_at ? formatDate(p.ends_at) : "—"}
                </TableCell>
                <TableCell>
                  {p.is_active ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="outline">Off</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void remove(p.id, p.title)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit promotion" : "Add promotion"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <ImageUploadField
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              label="Banner image"
              folder="promotions"
            />
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount_percent}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_percent: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Ends on</Label>
                <Input
                  type="date"
                  value={form.ends_at}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ends_at: e.target.value }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, is_active: Boolean(v) }))
                }
              />
              Active on storefront
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}