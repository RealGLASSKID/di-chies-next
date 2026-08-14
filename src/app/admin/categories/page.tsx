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

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  age_restricted: boolean;
  sort_order: number;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  sort_order: "0",
  is_active: true,
  age_restricted: false,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image_url: c.image_url ?? "",
      sort_order: String(c.sort_order ?? 0),
      is_active: c.is_active,
      age_restricted: c.age_restricted,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      image_url: form.image_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      age_restricted: form.age_restricted,
    };

    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Category updated" : "Category created");
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
  }

  async function remove(id: string, name: string) {
    if (
      !confirm(
        `Delete category “${name}”? Products in this category must be moved or deleted first.`,
      )
    )
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Category deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  return (
    <AdminShell
      title="Categories"
      description="Organise the store into departments. Products are assigned to these."
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Add category
        </Button>
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!categories.isLoading && (categories.data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No categories yet. Add one to start building the catalogue.
                </TableCell>
              </TableRow>
            )}
            {categories.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="size-10 overflow-hidden rounded-md border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        c.image_url ||
                        "https://placehold.co/80x80/e4e4e7/18181b?text=—"
                      }
                      alt=""
                      className="size-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  {c.description && (
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {c.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {c.slug}
                </TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell className="space-x-1">
                  {c.is_active ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Hidden</Badge>
                  )}
                  {c.age_restricted && <Badge variant="outline">18+</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void remove(c.id, c.name)}
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
              {editing ? "Edit category" : "Add category"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <ImageUploadField
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              label="Category image"
              folder="categories"
            />

            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: editing ? f.slug : slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
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
            <div className="grid gap-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_active}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, is_active: Boolean(v) }))
                  }
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.age_restricted}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, age_restricted: Boolean(v) }))
                  }
                />
                Age restricted (18+)
              </label>
            </div>
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