"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { formatNaira } from "@/lib/format";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_new_arrival: boolean;
  age_restricted: boolean;
  category_id: string;
  subcategory_id: string | null;
  image_url: string | null;
  description: string;
  unit: string;
  sku: string;
  tags: string[] | null;
};

type CategoryOpt = { id: string; name: string; age_restricted: boolean };
type SubOpt = { id: string; name: string; category_id: string };

const UNITS = [
  "unit",
  "piece",
  "pack",
  "box",
  "bottle",
  "carton",
  "bag",
  "kg",
  "litre",
  "pair",
];

const emptyForm = {
  name: "",
  slug: "",
  brand: "",
  price: "",
  discount_price: "",
  stock_quantity: "0",
  category_id: "",
  subcategory_id: "",
  description: "",
  image_url: "",
  unit: "unit",
  sku: "",
  tags: "",
  is_available: true,
  is_featured: false,
  is_popular: false,
  is_new_arrival: false,
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

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, age_restricted")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as CategoryOpt[];
    },
  });

  const subcategories = useQuery({
    queryKey: ["admin-subcategories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, category_id")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data as SubOpt[];
    },
  });

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    categories.data?.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories.data]);

  const subsForCategory = useMemo(() => {
    if (!form.category_id) return [];
    return (subcategories.data ?? []).filter(
      (s) => s.category_id === form.category_id,
    );
  }, [form.category_id, subcategories.data]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      brand: p.brand ?? "",
      price: String(p.price ?? 0),
      discount_price:
        p.discount_price != null ? String(p.discount_price) : "",
      stock_quantity: String(p.stock_quantity ?? 0),
      category_id: p.category_id,
      subcategory_id: p.subcategory_id ?? "",
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      unit: p.unit || "unit",
      sku: p.sku ?? "",
      tags: (p.tags ?? []).join(", "),
      is_available: p.is_available,
      is_featured: p.is_featured,
      is_popular: p.is_popular,
      is_new_arrival: p.is_new_arrival,
      age_restricted: p.age_restricted,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.category_id || !form.price) {
      toast.error("Name, category and price are required");
      return;
    }
    setSaving(true);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      brand: form.brand.trim(),
      price: Number(form.price),
      discount_price: form.discount_price
        ? Number(form.discount_price)
        : null,
      stock_quantity: Number(form.stock_quantity) || 0,
      category_id: form.category_id,
      subcategory_id: form.subcategory_id || null,
      description: form.description.trim(),
      image_url: form.image_url.trim() || null,
      unit: form.unit || "unit",
      sku: form.sku.trim(),
      tags,
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      is_new_arrival: form.is_new_arrival,
      age_restricted: form.age_restricted,
    };

    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Product updated" : "Product created");
    setOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    await queryClient.invalidateQueries({
      queryKey: ["admin-dashboard-stats"],
    });
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  const filtered =
    products.data?.filter((p) => {
      if (filterCategory !== "all" && p.category_id !== filterCategory)
        return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }) ?? [];

  return (
    <AdminShell
      title="Products"
      description="Add, edit and manage catalogue items across all categories."
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Add product
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, brand, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.data?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground sm:ml-auto">
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Loading products…
                </TableCell>
              </TableRow>
            )}
            {!products.isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No products found. Click “Add product” to create one.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
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
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.brand || "—"}
                    {p.sku ? ` · ${p.sku}` : ""}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {categoryName.get(p.category_id) || "—"}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatNaira(Number(p.price))}
                  </div>
                  {p.discount_price != null && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                      Sale {formatNaira(Number(p.discount_price))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      p.stock_quantity <= 5
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : ""
                    }
                  >
                    {p.stock_quantity}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {p.unit}
                  </span>
                </TableCell>
                <TableCell className="space-x-1">
                  {!p.is_available && (
                    <Badge variant="destructive">Hidden</Badge>
                  )}
                  {p.is_featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  {p.is_popular && (
                    <Badge variant="secondary">Popular</Badge>
                  )}
                  {p.is_new_arrival && (
                    <Badge variant="secondary">New</Badge>
                  )}
                  {p.age_restricted && (
                    <Badge variant="outline">18+</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(p)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void remove(p.id, p.name)}
                      aria-label="Delete"
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit product" : "Add product"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <ImageUploadField
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              label="Product image"
              folder="products"
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
                placeholder="e.g. Royal Stallion Rice 50kg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  placeholder="DC-00001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Brand</Label>
                <Input
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => {
                    const cat = categories.data?.find((c) => c.id === v);
                    setForm((f) => ({
                      ...f,
                      category_id: v,
                      subcategory_id: "",
                      age_restricted: cat?.age_restricted
                        ? true
                        : f.age_restricted,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.age_restricted ? " (18+)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Subcategory</Label>
                <Select
                  value={form.subcategory_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      subcategory_id: v === "none" ? "" : v,
                    }))
                  }
                  disabled={!form.category_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subsForCategory.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Price (₦) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Discount price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.discount_price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_price: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock_quantity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      stock_quantity: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="rice, staple, grains"
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Short product description for customers"
              />
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-3 rounded-lg border border-border bg-muted/30 p-3">
              {(
                [
                  ["is_available", "Available on storefront"],
                  ["is_featured", "Featured"],
                  ["is_popular", "Popular"],
                  ["is_new_arrival", "New arrival"],
                  ["age_restricted", "Age restricted (18+)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form[key]}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, [key]: Boolean(v) }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving
                ? "Saving…"
                : editing
                  ? "Update product"
                  : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}