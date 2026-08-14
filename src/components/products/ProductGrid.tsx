"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";

import { ProductCard } from "@/components/products/ProductCard";
import { QuickViewDialog } from "@/components/products/QuickViewDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Product } from "@/types/catalog";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-md border border-border p-0">
          <Skeleton className="aspect-square w-full rounded-b-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({
  products,
  categories,
  loading,
  emptyTitle = "No products found",
  emptyDescription = "Try a different search term or clear your filters.",
  skeletonCount = 8,
}: {
  products: Product[] | undefined;
  categories?: Category[] | undefined;
  loading?: boolean | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  skeletonCount?: number | undefined;
}) {
  const [quickView, setQuickView] = useState<Product | null>(null);

  if (loading) return <ProductGridSkeleton count={skeletonCount} />;
  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch className="size-8" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const categoryName = (id: string) => categories?.find((category) => category.id === id)?.name;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryName={categoryName(product.category_id)}
            onQuickView={setQuickView}
          />
        ))}
      </div>
      <QuickViewDialog product={quickView} onOpenChange={(open) => !open && setQuickView(null)} />
    </>
  );
}