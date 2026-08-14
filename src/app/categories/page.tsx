"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import { categoriesQuery, subcategoriesQuery } from "@/lib/queries";

function CategoriesPage() {
  const { data: categories, isPending } = useQuery(categoriesQuery);
  const { data: subcategories } = useQuery(subcategoriesQuery);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Departments"
        title="Browse the whole store"
        description="Thirteen departments, hundreds of aisles. Pick a department to start filling your basket."
      />
      <div className="container-page grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
        {isPending &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-md bg-surface-strong" />
          ))}
        {categories?.map((category) => {
          const aisles = (subcategories ?? []).filter((sub) => sub.category_id === category.id);
          return (
            <article
              key={category.id}
              className="overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lift"
            >
              <Link href={`/categories/${category.slug }`} className="block">
                <ProductImage
                  src={category.image_url}
                  alt={category.name}
                  className="aspect-16/9 w-full"
                />
              </Link>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    <Link href={`/categories/${category.slug }`} className="hover:underline">
                      {category.name}
                    </Link>
                  </h2>
                  {category.age_restricted && <Badge variant="outline">18+</Badge>}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
                {aisles.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {aisles.slice(0, 4).map((sub) => (
                      <li key={sub.id}>
                        <Link href={`/shop?category=${category.slug}&subcategory=${sub.id }`}
                          className="rounded-sm border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </SiteLayout>
  );
}


export default CategoriesPage;
