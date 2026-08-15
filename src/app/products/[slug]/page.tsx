"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, Store } from "lucide-react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useCart } from "@/hooks/useCart";
import { discountPercent, effectivePrice, formatNaira } from "@/lib/format";
import { categoriesQuery, productBySlugQuery, productsQuery } from "@/lib/queries";

function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isPending } = useQuery(productBySlugQuery(slug));
  const { data: categories } = useQuery(categoriesQuery);
  const { addItem, isAdmin } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [active, setActive] = useState(0);

  const related = useQuery({
    ...productsQuery({ pageSize: 4, sort: "popular" }),
    enabled: !!product,
  });

  if (isPending) {
    return (
      <SiteLayout>
        <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-md bg-surface-strong" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-surface-strong" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-strong" />
            <div className="h-24 animate-pulse rounded bg-surface-strong" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="container-page py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button asChild className="mt-6">
            <Link href="/shop">Back to shop</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const category = categories?.find((item) => item.id === product.category_id);
  const gallery = [product.image_url, ...(product.additional_images ?? [])].filter(Boolean) as string[];
  const saving = discountPercent(product);
  const outOfStock = !product.is_available || product.stock_quantity <= 0;

  return (
    <SiteLayout>
      <div className="container-page py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/categories/${category.slug }`}
                className="hover:text-foreground"
              >
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <ProductImage
              src={gallery[active] ?? product.image_url}
              alt={product.name}
              priority
              className="aspect-square w-full rounded-md border border-border"
            />
            {gallery.length > 1 && (
              <div className="mt-3 flex gap-3">
                {gallery.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`size-20 overflow-hidden rounded-sm border ${
                      index === active ? "border-foreground" : "border-border"
                    }`}
                  >
                    <ProductImage src={image} alt="" className="size-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {category && <p className="eyebrow">{category.name}</p>}
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {product.brand} · SKU {product.sku} · per {product.unit}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-semibold">{formatNaira(effectivePrice(product))}</span>
              {saving && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatNaira(product.price)}
                  </span>
                  <Badge>-{saving}%</Badge>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{outOfStock ? "Out of stock" : `${product.stock_quantity} in stock`}</Badge>
              {product.age_restricted && <Badge variant="outline">Age restricted 18+</Badge>}
              {product.is_new_arrival && <Badge variant="outline">New arrival</Badge>}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {isAdmin ? (
              <div className="mt-8 rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
                You&apos;re signed in as the store admin — bookings are for customers only. Manage this
                product from the{" "}
                <Link href="/admin/products" className="font-medium text-foreground underline">
                  admin console
                </Link>
                .
              </div>
            ) : (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-md border border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  >
                    <Minus className="size-4" aria-hidden />
                  </Button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity((value) => Math.min(product.stock_quantity || 99, value + 1))
                    }
                  >
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </div>
                <Button size="lg" disabled={outOfStock} onClick={() => addItem(product, quantity)}>
                  Add to booking
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/cart">View basket</Link>
                </Button>
              </div>
            )}

            <div className="mt-8 flex items-start gap-3 rounded-md border border-border bg-surface p-4">
              <Store className="mt-0.5 size-5" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Collection only. We hold your reservation for 24 hours after your chosen slot — pay at the
                DI CHIES collection desk.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <h2 className="text-2xl font-bold">You may also like</h2>
          <div className="mt-6">
            <ProductGrid
              products={related.data?.items.filter((item) => item.id !== product.id).slice(0, 4)}
              categories={categories}
              loading={related.isPending}
              skeletonCount={4}
            />
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}


export default ProductPage;