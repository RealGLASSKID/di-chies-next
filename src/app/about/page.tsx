"use client";

import Link from "next/link";
import { Camera, Clock, MapPin, ShieldCheck, UserCheck } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";

const hours = [
  { day: "Sunday – Saturday", time: "8:00 AM – 10:00 PM" },
];

const teamQuotes = [
  {
    name: "Amaka",
    role: "Store Supervisor",
    quote:
      "We check every shelf every morning, so what you reserve online is exactly what's waiting for you at the desk.",
  },
  {
    name: "Tunde",
    role: "Collection Desk Lead",
    quote:
      "Every pickup is matched to the name and reference on the booking before anything leaves the store — no exceptions.",
  },
  {
    name: "Bisi",
    role: "Store Attendant",
    quote:
      "Customers tell us the aisles feel calm and organised. We keep it that way on purpose, for every visit.",
  },
];

const securityPoints = [
  "CCTV monitored shop floor and collection point, around the clock.",
  "Bookings are only released to the name and phone number on file.",
  "Nothing is paid upfront online — you inspect your items before you pay in store.",
  "Stock levels update live, so you never reserve something that isn't actually on the shelf.",
];

function AboutPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="DI CHIES"
        title="About DI CHIES"
        description="A modern supermarket built around reserve-online, collect-in-store shopping."
      />

      {/* Store image + story */}
      <section className="border-b border-border">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-2 lg:items-center">
          <img
            src="https://xdsddhxiyvqlydubxdvl.supabase.co/storage/v1/object/public/product-images/images/hero-portrait.jfif"
            alt="The DI CHIES supermarket storefront"
            className="aspect-4/3 w-full rounded-md border border-border object-cover shadow-lift"
          />
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Everything a supermarket should be, without the queues
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              DI CHIES brings the full supermarket experience online without delivery. Browse thirteen
              departments, reserve what you need, and collect at a time that suits you. Every price you
              see is the shelf price, and stock counts update as our aisles are replenished — so what's
              in your basket online is what's waiting for you in store.
            </p>
            <Button asChild className="mt-6">
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Opening hours */}
      <section className="border-b border-border bg-surface">
        <div className="container-page py-8">
          <div className="flex flex-wrap items-center gap-4">
            <Clock className="size-6 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Opening hours</p>
              <p className="text-sm text-muted-foreground">
                {hours.map((h) => `${h.day}: ${h.time}`).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner */}
      <section className="border-b border-border">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[280px_1fr] lg:items-center">
          <div className="mx-auto w-48 overflow-hidden rounded-full border border-border shadow-lift lg:w-full lg:rounded-md">
            <img
              src="/images/owner-placeholder.svg"
              alt="Illustrated placeholder portrait of the DI CHIES store owner"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Founder &amp; Owner</p>
            <h2 className="mt-2 font-display text-2xl font-bold">A note from our founder</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              &ldquo;I started DI CHIES because I wanted a supermarket run the way I'd want to shop
              myself — honest prices, real stock, and staff who treat every customer like a
              neighbour. Whether you're booking online or walking in, you'll always be looked after
              here.&rdquo;
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Camera className="size-4" aria-hidden />
              Placeholder portrait — replace with a real photo any time by swapping
              <code className="rounded bg-muted px-1 py-0.5">/public/images/owner-placeholder.svg</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Team quotes */}
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12">
          <p className="eyebrow">Our team</p>
          <h2 className="mt-2 font-display text-2xl font-bold">In their own words</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {teamQuotes.map((member) => (
              <figure key={member.name} className="rounded-md border border-border bg-background p-6">
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{member.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {member.name}
                  <span className="block text-xs font-normal text-muted-foreground">{member.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="border-b border-border">
        <div className="container-page py-12">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6" aria-hidden />
            <h2 className="font-display text-2xl font-bold">How we keep it secure</h2>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {securityPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-md border border-border p-4">
                <UserCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="text-sm text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Visit us */}
      <section>
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-12">
          <div className="flex items-center gap-3">
            <MapPin className="size-6 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Visit us in store</p>
              <p className="text-sm text-muted-foreground">
                Find directions and store details on our contact page.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/contact">Get directions</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}


export default AboutPage;