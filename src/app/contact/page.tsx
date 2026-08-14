"use client";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";

function Page() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="Contact Us" description="Reach the DI CHIES team about bookings, stock and collections." />
      <div className="container-page prose-sm max-w-3xl py-12 text-sm leading-relaxed text-muted-foreground">
        <p>Collection desk: open 8am to 9pm daily. Phone +234 800 000 0000 or email hello@dichies.com and our store team will respond the same day.</p>
      </div>
    </SiteLayout>
  );
}


export default Page;
