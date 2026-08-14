"use client";

import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useCart } from "@/hooks/useCart";
import { discountPercent, effectivePrice, formatNaira } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function ProductCard({
  product,
  categoryName,
  onQuickView,
}: {
  product: Product;
  categoryName?: string | undefined;
  onQuickView?: ((product: Product) => void) | undefined;
}) {
  const { addItem } = useCart();
  const saving = discountPercent(product);
  const outOfStock = !product.is_available || product.stock_quantity <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lift">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden"
        aria-label={product.name}
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="size-full transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {saving && <Badge className="rounded-sm">-{saving}%</Badge>}
          {product.is_new_arrival && (
            <Badge variant="secondary" className="rounded-sm">
              New
            </Badge>
          )}
          {product.age_restricted && (
            <Badge variant="outline" className="rounded-sm bg-card/90">
              18+
            </Badge>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-xs font-semibold uppercase tracking-widest">Out of stock</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {categoryName && <span className="eyebrow">{categoryName}</span>}
        <h3 className="text-sm font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">
          {product.brand} · per {product.unit}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold">{formatNaira(effectivePrice(product))}</span>
          {saving && (
            <span className="text-xs text-muted-foreground line-through">{formatNaira(product.price)}</span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={outOfStock}
            onClick={() => addItem(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="mr-1 size-4" aria-hidden />
            Add
          </Button>
          {onQuickView && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onQuickView(product)}
              aria-label={`Quick view ${product.name}`}
            >
              <Eye className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}