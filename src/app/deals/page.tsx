"use client";

import { useQuery } from "@tanstack/react-query";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { categoriesQuery, productsQuery } from "@/lib/queries";

function Page() {
  const { data: categories } = useQuery(categoriesQuery);
  const products = useQuery(productsQuery({ discountedOnly: true, pageSize: 24, sort: "price-asc" }));

  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="Today's Deals" description="Discounted groceries, drinks and household essentials at DI CHIES." />
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
