"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { products, count, loading } = useWishlist();

  if (authLoading) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Account" title="Wishlist" />
        <div className="container-page py-12 text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <PageHeader eyebrow="Account" title="Wishlist" />
        <div className="container-page py-12">
          <EmptyState
            title="Sign in to view your wishlist"
            description="Save products you love and come back to them later."
            action={
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Account"
        title="Wishlist"
        description={
          count > 0
            ? `${count} saved item${count === 1 ? "" : "s"}`
            : "Products you save appear here."
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/account">Back to account</Link>
          </Button>
        }
      />
      <div className="container-page py-10">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading wishlist…</p>
        )}
        {!loading && products.length === 0 && (
          <EmptyState
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here."
            action={
              <Button asChild>
                <Link href="/shop">
                  <ShoppingBag className="mr-2 size-4" />
                  Browse shop
                </Link>
              </Button>
            }
          />
        )}
        {products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {!loading && products.length === 0 && (
          <div className="mt-6 flex justify-center text-muted-foreground">
            <Heart className="size-8 opacity-30" />
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
