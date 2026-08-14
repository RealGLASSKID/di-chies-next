"use client";

import Link from "next/link";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function AccountPage() {
  const { user, profile } = useAuth();

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Account"
        title={profile?.full_name || user?.email || "My account"}
        description="Track your collection bookings and keep your contact details up to date."
      />
      <div className="container-page grid gap-4 py-12 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-24 justify-start">
          <Link href="/account/bookings">My bookings</Link>
        </Button>
        <Button asChild variant="outline" className="h-24 justify-start">
          <Link href="/account/settings">Profile settings</Link>
        </Button>
        <Button asChild variant="outline" className="h-24 justify-start">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </SiteLayout>
  );
}


export default AccountPage;
