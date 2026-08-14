"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { categoriesQuery, productsQuery } from "@/lib/queries";

function Page() {
  const { data: categories } = useQuery(categoriesQuery);
  const products = useQuery(productsQuery({ newOnly: true, pageSize: 24, sort: "newest" }));

  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="New Arrivals" description="The newest products on the DI CHIES shelves." />
      <div className="container-page py-10">
        <ProductGrid
          products={products.data?.items}
          categories={categories}
          loading={products.isPending}
          skeletonCount={12}
        />
      </div>
    </SiteLayout>
  );
}


export default Page;
