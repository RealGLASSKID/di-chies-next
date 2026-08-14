"use client";

// Search params require client-side rendering

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { FilterPanel, type ShopFilterValues } from "@/components/shop/FilterPanel";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  brandsQuery,
  categoriesQuery,
  productsQuery,
  subcategoriesQuery,
  type ProductSort,
} from "@/lib/queries";

type ShopSearch = {
  category?: string | undefined;
  subcategory?: string | undefined;
  brands?: string[] | undefined;
  min?: number | undefined;
  max?: number | undefined;
  inStock?: boolean | undefined;
  discounted?: boolean | undefined;
  sort?: ProductSort | undefined;
  page?: number | undefined;
  q?: string | undefined;
};

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

function ShopPageInner() {
  const searchParams = useSearchParams();
  const search = {
    category: searchParams.get("category") ?? undefined,
    subcategory: searchParams.get("subcategory") ?? undefined,
    brands: searchParams.getAll("brands").length ? searchParams.getAll("brands") : undefined,
    min: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
    max: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
    inStock: searchParams.get("inStock") === "true" ? true : undefined,
    discounted: searchParams.get("discounted") === "true" ? true : undefined,
    sort: (searchParams.get("sort") as any) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    q: searchParams.get("q") ?? undefined,
  };
  const router = useRouter();

  const values: ShopFilterValues = {
    category: search.category,
    subcategory: search.subcategory,
    brands: search.brands ?? [],
    min: search.min,
    max: search.max,
    inStock: search.inStock ?? false,
    discounted: search.discounted ?? false,
  };

  const { data: categories } = useQuery(categoriesQuery);
  const { data: subcategories } = useQuery(subcategoriesQuery);
  const { data: brands } = useQuery(brandsQuery(search.category));
  const page = search.page ?? 1;
  const pageSize = 24;

  const products = useQuery(
    productsQuery({
      categorySlug: search.category,
      subcategoryId: search.subcategory,
      brands: values.brands,
      minPrice: values.min,
      maxPrice: values.max,
      inStockOnly: values.inStock,
      discountedOnly: values.discounted,
      search: search.q,
      sort: search.sort ?? "newest",
      page,
      pageSize,
    }),
  );

  function patch(next: Partial<ShopFilterValues> & { page?: number }) {
    const qs = buildShopQuery(search as Record<string, unknown>, {
      ...next,
      page: next.page ?? 1,
    });
    router.push(`/shop${qs}`);
  }

  function reset() {
    const qs = buildShopQuery({ sort: search.sort });
    router.push(`/shop${qs}`);
  }

  const total = products.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Catalogue"
        title="Shop all products"
        description="Everything on the DI CHIES shelves, with live pricing in Naira. Reserve now and collect in store."
      />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel
            categories={categories}
            subcategories={subcategories}
            brands={brands}
            values={values}
            onChange={patch}
            onReset={reset}
          />
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {products.isPending ? "Loading products…" : `${total} product${total === 1 ? "" : "s"}`}
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="mr-2 size-4" aria-hidden />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel
                      categories={categories}
                      subcategories={subcategories}
                      brands={brands}
                      values={values}
                      onChange={patch}
                      onReset={reset}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Select
                value={search.sort ?? "newest"}
                onValueChange={(value) =>
                  router.push(`/shop${buildShopQuery(search as Record<string, unknown>, { sort: value as ProductSort, page: 1 })}`)
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
          </div>

          <ProductGrid
            products={products.data?.items}
            categories={categories}
            loading={products.isPending}
            skeletonCount={12}
          />

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  router.push(`/shop${buildShopQuery(search as Record<string, unknown>, { page: Math.max(1, page - 1) })}`)
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
                onClick={() => router.push(`/shop${buildShopQuery(search as Record<string, unknown>, { page: page + 1 })}`)}
              >
                Next
              </Button>
            </nav>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}


import { Suspense } from "react";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted-foreground">Loading…</div>}>
      <ShopPageInner />
    </Suspense>
  );
}

