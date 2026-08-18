"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/ui/product-image";
import {
  formatDate,
  isPromotionEnded,
  isPromotionLive,
} from "@/lib/format";
import {
  categoriesQuery,
  promotionByIdQuery,
  promotionProductsQuery,
} from "@/lib/queries";

export default function PromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const promo = useQuery(promotionByIdQuery(id));
  const products = useQuery(promotionProductsQuery(id));
  const { data: categories } = useQuery(categoriesQuery);

  const categoryName = (categoryId: string) =>
    categories?.find((c) => c.id === categoryId)?.name;

  if (promo.isPending) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-sm text-muted-foreground">Loading offer…</div>
      </SiteLayout>
    );
  }

  if (!promo.data) {
    return (
      <SiteLayout>
        <div className="container-page py-20">
          <EmptyState
            title="Promotion not found"
            description="This offer may have been removed."
            action={
              <Button asChild>
                <Link href="/deals">Browse deals</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  const p = promo.data;
  const live = isPromotionLive(p);
  const ended = isPromotionEnded(p);
  const promoPercent = live ? Number(p.discount_percent) : null;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Promotion"
        title={p.title}
        description={p.description || undefined}
      />

      <div className="container-page pb-16">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {live ? (
            <Badge className="rounded-sm">Save {Number(p.discount_percent)}%</Badge>
          ) : ended ? (
            <Badge variant="secondary" className="rounded-sm">
              This offer has ended
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-sm">
              Not active
            </Badge>
          )}
          {p.ends_at && (
            <span className="text-sm text-muted-foreground">
              {ended ? "Ended" : "Ends"} {formatDate(p.ends_at)}
            </span>
          )}
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link href="/deals">Today&apos;s Deals</Link>
          </Button>
        </div>

        {p.image_url && (
          <div className="mb-10 overflow-hidden rounded-md border border-border">
            <ProductImage
              src={p.image_url}
              alt={p.title}
              className="aspect-[21/9] w-full object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {!live && (
          <p className="mb-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
            {ended
              ? "This promotion has ended. Prices below are regular catalogue prices. New promotions from DI CHIES will appear on the home page when published."
              : "This promotion is not currently live. Products are shown at regular prices."}
          </p>
        )}

        {products.isPending ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : (products.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No products in this offer yet"
            description="Check back soon, or browse the full deals page."
            action={
              <Button asChild>
                <Link href="/deals">Today&apos;s Deals</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.data!.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryName(product.category_id)}
                promoPercent={promoPercent}
                allowAdd={live}
              />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
