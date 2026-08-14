"use client";

// Search params require client-side rendering

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, productsQuery, subcategoriesQuery, type ProductSort } from "@/lib/queries";

type CategorySearch = { subcategory?: string | undefined; sort?: ProductSort | undefined; page?: number | undefined };

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
];


function buildShopQuery(current: Record<string, unknown>, patch: Record<string, unknown> = {}) {
  const merged: Record<string, unknown> = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function CategoryPageInner() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const searchParams = useSearchParams();
  const search = {
    subcategory: searchParams.get("subcategory") ?? undefined,
    sort: (searchParams.get("sort") as import("@/lib/queries").ProductSort | null) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
  };
  const router = useRouter();

  const { data: categories } = useQuery(categoriesQuery);
  const { data: subcategories } = useQuery(subcategoriesQuery);
  const category = categories?.find((item) => item.slug === slug);
  const aisles = (subcategories ?? []).filter((sub) => sub.category_id === category?.id);

  const page = search.page ?? 1;
  const pageSize = 24;
  const products = useQuery(
    productsQuery({
      categorySlug: slug,
      subcategoryId: search.subcategory,
      sort: search.sort ?? "newest",
      page,
      pageSize,
    }),
  );

  const total = products.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Department"
        title={category?.name ?? "Department"}
        description={category?.description ?? undefined}
        actions={
          category?.age_restricted ? <Badge variant="outline">Age restricted · 18+ only</Badge> : undefined
        }
      />

      <div className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={search.subcategory ? "outline" : "default"}
              size="sm"
              onClick={() => router.push(`/categories/${slug}${buildShopQuery(search as Record<string, unknown>, { subcategory: undefined, page: 1 })}`)}
            >
              All aisles
            </Button>
            {aisles.map((sub) => (
              <Button
                key={sub.id}
                variant={search.subcategory === sub.id ? "default" : "outline"}
                size="sm"
                onClick={() => router.push(`/categories/${slug}${buildShopQuery(search as Record<string, unknown>, { subcategory: sub.id, page: 1 })}`)}
              >
                {sub.name}
              </Button>
            ))}
          </div>
          <Select
            value={search.sort ?? "newest"}
            onValueChange={(value) =>
              router.push(`/categories/${slug}${buildShopQuery(search as Record<string, unknown>, { sort: value as ProductSort, page: 1 })}`)
            }
          >
            <SelectTrigger className="w-48" aria-label="Sort products">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {products.isPending ? "Loading products…" : `${total} product${total === 1 ? "" : "s"}`}
        </p>

        <div className="mt-6">
          <ProductGrid
            products={products.data?.items}
            categories={categories}
            loading={products.isPending}
            skeletonCount={12}
            emptyTitle="This aisle is empty"
            emptyDescription="Nothing here right now — try another aisle or browse the full catalogue."
          />
        </div>

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() =>
                router.push(`/categories/${slug}${buildShopQuery(search as Record<string, unknown>, { page: Math.max(1, page - 1) })}`)
              }
            >
              Previous
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => router.push(`/categories/${slug}${buildShopQuery(search as Record<string, unknown>, { page: page + 1 })}`)}
            >
              Next
            </Button>
          </nav>
        )}

        <div className="mt-14">
          <Link href="/categories" className="text-sm font-semibold hover:underline">
            ← All departments
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}


import { Suspense } from "react";

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted-foreground">Loading…</div>}>
      <CategoryPageInner />
    </Suspense>
  );
}

