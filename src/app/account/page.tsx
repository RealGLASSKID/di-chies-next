"use client";

import Link from "next/link";
import { ClipboardList, Heart, Settings, ShoppingBag, LayoutDashboard } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";

export default function AccountPage() {
  const { user, profile, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Account"
        title={profile?.full_name || user?.email || "My account"}
        description={
          isAdmin
            ? "Manage your store admin profile and customer account."
            : "Track your collection bookings, wishlist, and contact details."
        }
      />
      <div className="container-page grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <Button asChild variant="outline" className="h-24 justify-start gap-3">
            <Link href="/admin">
              <LayoutDashboard className="size-5 shrink-0" />
              <span>Admin console</span>
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="h-24 justify-start gap-3">
          <Link href="/account/bookings">
            <ClipboardList className="size-5 shrink-0" />
            <span>My bookings</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 justify-start gap-3">
          <Link href="/account/wishlist">
            <Heart className="size-5 shrink-0" />
            <span>
              Wishlist
              {wishlistCount > 0 ? ` (${wishlistCount})` : ""}
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 justify-start gap-3">
          <Link href="/account/settings">
            <Settings className="size-5 shrink-0" />
            <span>Profile settings</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-24 justify-start gap-3">
          <Link href="/shop">
            <ShoppingBag className="size-5 shrink-0" />
            <span>Continue shopping</span>
          </Link>
        </Button>
      </div>
    </SiteLayout>
  );
}
