"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Twitter } from "lucide-react";

import { Wordmark } from "@/components/layout/SiteHeader";
import { categoriesQuery } from "@/lib/queries";

export function SiteFooter() {
  const { data: categories } = useQuery(categoriesQuery);

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            DI CHIES is a modern supermarket where you browse the aisles online, reserve what you need and
            collect it in store — no delivery, no waiting.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              href="https://instagram.com"
              aria-label="DI CHIES on Instagram"
              className="rounded-sm border border-border p-2 text-muted-foreground hover:text-foreground"
            >
              <Instagram className="size-4" aria-hidden />
            </a>
            <a
              href="https://facebook.com"
              aria-label="DI CHIES on Facebook"
              className="rounded-sm border border-border p-2 text-muted-foreground hover:text-foreground"
            >
              <Facebook className="size-4" aria-hidden />
            </a>
            <a
              href="https://twitter.com"
              aria-label="DI CHIES on X"
              className="rounded-sm border border-border p-2 text-muted-foreground hover:text-foreground"
            >
              <Twitter className="size-4" aria-hidden />
            </a>
          </div>
        </div>

        <nav aria-label="Departments">
          <p className="eyebrow">Departments</p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories?.slice(0, 7).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Your account">
          <p className="eyebrow">Your account</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/account" className="text-muted-foreground hover:text-foreground">
                My account
              </Link>
            </li>
            <li>
              <Link href="/account/bookings" className="text-muted-foreground hover:text-foreground">
                My bookings
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-muted-foreground hover:text-foreground">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-muted-foreground hover:text-foreground">
                Create account
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="eyebrow">Company</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                About DI CHIES
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                Help &amp; FAQ
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                Privacy policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DI CHIES Supermarket. All rights reserved.</p>
          <p>Reserve online · Collect in store · Lagos, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
