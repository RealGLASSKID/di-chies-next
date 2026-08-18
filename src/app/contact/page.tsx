"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/layout/SiteLayout";

const STORE_ADDRESS = "Tailor Bus Stop, Ijegun, Lagos, Nigeria";
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(STORE_ADDRESS)}&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;

function ContactPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="DI CHIES"
        title="Contact Us"
        description="Reach the DI CHIES team about bookings, stock and collections."
      />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[380px_1fr]">
        {/* Details */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Store address</p>
              <p className="text-sm text-muted-foreground">{STORE_ADDRESS}</p>
              <a
                href={MAP_LINK}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm font-medium underline"
              >
                Get directions
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Opening hours</p>
              <p className="text-sm text-muted-foreground">Sunday – Saturday: 8:00 AM – 10:00 PM</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Phone</p>
              <a href="tel:+2348000000000" className="text-sm text-muted-foreground hover:underline">
                +234 800 000 0000
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Email</p>
              <a href="mailto:hello@dichies.com" className="text-sm text-muted-foreground hover:underline">
                hello@dichies.com
              </a>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            For questions about a booking, stock or collection times, call, email or reserve online and
            our store team will respond the same day.
          </p>
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-md border border-border">
          <iframe
            title="DI CHIES store location map"
            src={MAP_EMBED_SRC}
            width="100%"
            height="100%"
            style={{ minHeight: 420, border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </SiteLayout>
  );
}


export default ContactPage;