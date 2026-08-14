"use client";

// Search params require client-side rendering

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoriesQuery, productsQuery } from "@/lib/queries";

function SearchPageInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const router = useRouter();
  const [term, setTerm] = useState(q ?? "");
  const { data: categories } = useQuery(categoriesQuery);
  const products = useQuery({ ...productsQuery({ search: q, pageSize: 24 }), enabled: !!q });

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Search"
        title={q ? `Results for “${q}”` : "Search the store"}
        description="Search by product name, brand or description."
      />
      <div className="container-page py-10">
        <form
          className="flex max-w-xl gap-2"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(term.trim() ? `/search?q=${encodeURIComponent(term.trim())}` : "/search");
          }}
        >
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <Input
            id="search-input"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="e.g. digestive biscuits"
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="mt-10">
          {q ? (
            <ProductGrid
              products={products.data?.items}
              categories={categories}
              loading={products.isPending}
              skeletonCount={8}
              emptyTitle="No matches"
              emptyDescription="Try a shorter term or browse the departments instead."
            />
          ) : (
            <p className="text-sm text-muted-foreground">Enter a search term to see products.</p>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}



import { Suspense } from "react";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted-foreground">Loading…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}

