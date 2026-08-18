"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";

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
import { formatDate, isPromotionEnded, isPromotionLive } from "@/lib/format";
import type { Product } from "@/types/catalog";

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
  productIds: [] as string[],
};

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

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

  const allProducts = useQuery({
    queryKey: ["admin-all-products-mini"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,brand,price,discount_price,image_url,is_available,category_id")
        .order("name")
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Pick<
        Product,
        "id" | "name" | "brand" | "price" | "discount_price" | "image_url" | "is_available" | "category_id"
      >[];
    },
  });

  const productCounts = useQuery({
    queryKey: ["admin-promo-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotion_products").select("promotion_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const id = row.promotion_id as string;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    },
  });

  const filteredProducts = useMemo(() => {
    const list = allProducts.data ?? [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return list.slice(0, 40);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [allProducts.data, productSearch]);

  const selectedProducts = useMemo(() => {
    const list = allProducts.data ?? [];
    const set = new Set(form.productIds);
    return list.filter((p) => set.has(p.id));
  }, [allProducts.data, form.productIds]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setProductSearch("");
    setOpen(true);
  }

  async function openEdit(p: PromoRow) {
    setEditing(p);
    setProductSearch("");
    const { data: links } = await supabase
      .from("promotion_products")
      .select("product_id")
      .eq("promotion_id", p.id);
    setForm({
      title: p.title,
      description: p.description ?? "",
      discount_percent: String(p.discount_percent ?? 0),
      image_url: p.image_url ?? "",
      is_active: p.is_active,
      ends_at: p.ends_at ? p.ends_at.slice(0, 10) : "",
      productIds: (links ?? []).map((l) => l.product_id as string),
    });
    setOpen(true);
  }

  function toggleProduct(id: string) {
    setForm((f) => {
      const has = f.productIds.includes(id);
      return {
        ...f,
        productIds: has ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
      };
    });
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const pct = Number(form.discount_percent);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast.error("Discount % must be between 0 and 100");
      return;
    }
    if (form.productIds.length === 0) {
      toast.error("Select at least one product for this promotion");
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      discount_percent: pct,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      ends_at: form.ends_at ? new Date(form.ends_at + "T23:59:59").toISOString() : null,
    };

    try {
      let promoId = editing?.id;
      if (editing) {
        const { error } = await supabase.from("promotions").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("promotions").insert(payload).select("id").single();
        if (error) throw error;
        promoId = data.id;
      }

      if (!promoId) throw new Error("Missing promotion id");

      // Replace product links
      await supabase.from("promotion_products").delete().eq("promotion_id", promoId);
      if (form.productIds.length > 0) {
        const rows = form.productIds.map((product_id) => ({
          promotion_id: promoId!,
          product_id,
        }));
        const { error: linkError } = await supabase.from("promotion_products").insert(rows);
        if (linkError) throw linkError;
      }

      toast.success(editing ? "Promotion updated" : "Promotion created");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-promo-product-counts"] });
      await queryClient.invalidateQueries({ queryKey: ["promotions"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save promotion");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this promotion? Products stay in the catalogue.")) return;
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Promotion deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-promo-product-counts"] });
    await queryClient.invalidateQueries({ queryKey: ["promotions"] });
  }

  return (
    <AdminShell
      title="Promotions"
      description="Create offers, pick the products that belong to each one, and set one discount % for the whole promotion."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add promotion
        </Button>
      }
    >
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Ends</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(promos.data ?? []).map((p) => {
              const ended = isPromotionEnded(p);
              const live = isPromotionLive(p);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{Number(p.discount_percent)}%</TableCell>
                  <TableCell>{productCounts.data?.[p.id] ?? 0}</TableCell>
                  <TableCell>{p.ends_at ? formatDate(p.ends_at) : "—"}</TableCell>
                  <TableCell>
                    {live ? (
                      <Badge className="rounded-sm">Live</Badge>
                    ) : ended ? (
                      <Badge variant="secondary" className="rounded-sm">
                        Ended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-sm">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => void openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => void remove(p.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!promos.isPending && (promos.data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No promotions yet. Create one and attach products.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit promotion" : "Add promotion"}</DialogTitle>
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
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Back to School Bundle"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Discount % (same for all products)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount_percent}
                  onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Ends on</Label>
                <Input
                  type="date"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: Boolean(v) }))}
              />
              Active on storefront
            </label>

            <div className="grid gap-2 border-t border-border pt-4">
              <Label>Products in this promotion *</Label>
              <p className="text-xs text-muted-foreground">
                Customers who open this offer will only see these products, each at the promotion
                discount above. A product can belong to more than one promotion.
              </p>

              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface p-2">
                  {selectedProducts.map((p) => (
                    <Badge key={p.id} variant="secondary" className="gap-1 rounded-sm pr-1">
                      {p.name}
                      <button
                        type="button"
                        className="rounded-sm p-0.5 hover:bg-background"
                        onClick={() => toggleProduct(p.id)}
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search products by name or brand…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                {filteredProducts.map((p) => {
                  const checked = form.productIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-0 hover:bg-accent/40"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleProduct(p.id)} />
                      <span className="flex-1 text-sm">
                        {p.name}
                        <span className="ml-2 text-xs text-muted-foreground">{p.brand}</span>
                      </span>
                    </label>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">No products match.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.productIds.length} product{form.productIds.length === 1 ? "" : "s"} selected
              </p>
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
