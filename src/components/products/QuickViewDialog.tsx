"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductImage } from "@/components/ui/product-image";
import { useCart } from "@/hooks/useCart";
import { discountPercent, effectivePrice, formatNaira } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function QuickViewDialog({
  product,
  onOpenChange,
}: {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem } = useCart();
  if (!product) return null;
  const saving = discountPercent(product);
  const outOfStock = !product.is_available || product.stock_quantity <= 0;

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {product.brand} · {product.sku}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            className="aspect-square w-full rounded-md border border-border"
          />
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {saving && <Badge>-{saving}% today</Badge>}
              {product.age_restricted && <Badge variant="outline">Age restricted 18+</Badge>}
              <Badge variant="secondary">{outOfStock ? "Out of stock" : "In stock"}</Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{formatNaira(effectivePrice(product))}</span>
              {saving && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatNaira(product.price)}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="eyebrow">Unit</dt>
                <dd>{product.unit}</dd>
              </div>
              <div>
                <dt className="eyebrow">Stock</dt>
                <dd>{product.stock_quantity}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" disabled={outOfStock} onClick={() => addItem(product)}>
                Add to cart
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/products/${product.slug}`}>
                  Full details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}