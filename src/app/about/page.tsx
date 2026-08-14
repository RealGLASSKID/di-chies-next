"use client";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";

function Page() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="DI CHIES" title="About DI CHIES" description="A modern supermarket built around reserve-online, collect-in-store shopping." />
      <div className="container-page prose-sm max-w-3xl py-12 text-sm leading-relaxed text-muted-foreground">
        <p>DI CHIES brings the full supermarket experience online without delivery. Browse thirteen departments, reserve what you need, and collect at a time that suits you. Every price you see is the shelf price, and stock counts update as our aisles are replenished.</p>
      </div>
    </SiteLayout>
  );
}


export default Page;
