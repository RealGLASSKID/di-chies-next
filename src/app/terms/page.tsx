"use client";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";

function Page() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="Terms of Service" description="The terms that govern bookings and collections at DI CHIES." />
      <div className="container-page prose-sm max-w-3xl py-12 text-sm leading-relaxed text-muted-foreground">
        <p>Reservations are subject to availability at the time of collection. DI CHIES may substitute or cancel items that are out of stock, and no payment is taken until collection.</p>
      </div>
    </SiteLayout>
  );
}


export default Page;
