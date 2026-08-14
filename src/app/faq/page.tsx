"use client";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";

function Page() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="Help and FAQ" description="Answers about bookings, collection slots and payments at DI CHIES." />
      <div className="container-page prose-sm max-w-3xl py-12 text-sm leading-relaxed text-muted-foreground">
        <p>Bookings are held for 24 hours after your chosen slot. Payment is taken in store at collection — we do not deliver. Age-restricted items require valid ID at pickup.</p>
      </div>
    </SiteLayout>
  );
}


export default Page;
