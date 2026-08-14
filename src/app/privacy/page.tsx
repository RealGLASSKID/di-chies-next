"use client";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";

function Page() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="Privacy Policy" description="How DI CHIES handles your personal information." />
      <div className="container-page prose-sm max-w-3xl py-12 text-sm leading-relaxed text-muted-foreground">
        <p>We store only the details needed to process your booking: your name, phone number, email address and booking history. We never sell your data.</p>
      </div>
    </SiteLayout>
  );
}


export default Page;
