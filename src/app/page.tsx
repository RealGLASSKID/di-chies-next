"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarCheck, ClipboardList, Clock, ShieldCheck, ShoppingBasket, Store } from "lucide-react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { isPromotionEnded, isPromotionLive } from "@/lib/format";
import { categoriesQuery, productsQuery, promotionsQuery } from "@/lib/queries";

const STEPS = [
  {
    icon: ShoppingBasket,
    title: "Fill your basket",
    body: "Browse 13 departments and add everything you need — prices are live from our shelves.",
  },
  {
    icon: CalendarCheck,
    title: "Book a collection slot",
    body: "Choose the day and time that suits you. We only need your name and phone number.",
  },
  {
    icon: Store,
    title: "Collect in store",
    body: "Quote your booking reference at the DI CHIES collection desk and pay on pickup.",
  },
];

function HomePage() {
  const { data: categories, isPending: categoriesPending } = useQuery(categoriesQuery);
  const { data: promotions } = useQuery(promotionsQuery);
  const featured = useQuery(productsQuery({ featuredOnly: true, pageSize: 8, sort: "popular" }));
  const popular = useQuery(productsQuery({ popularOnly: true, pageSize: 8, sort: "popular" }));
  const fresh = useQuery(productsQuery({ newOnly: true, pageSize: 4, sort: "newest" }));

  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge variant="secondary" className="rounded-sm">
              Collection only · No delivery
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              The supermarket that holds your basket until you arrive.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              DI CHIES lets you shop the whole store online — groceries, drinks, wine, baby care, beauty,
              books, electronics and more — then reserve it for in-store collection at a time you choose.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/shop">Start shopping</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/categories">Browse departments</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              <div>
                <dt className="eyebrow">Products</dt>
                <dd className="mt-1 text-2xl font-semibold">150+</dd>
              </div>
              <div>
                <dt className="eyebrow">Departments</dt>
                <dd className="mt-1 text-2xl font-semibold">{categories?.length ?? 13}</dd>
              </div>
              <div>
                <dt className="eyebrow">Ready in</dt>
                <dd className="mt-1 text-2xl font-semibold">2 hrs</dd>
              </div>
            </dl>
          </div>
          <div className="relative">
            <img
              src="https://xdsddhxiyvqlydubxdvl.supabase.co/storage/v1/object/public/product-images/images/hero-portrait.jfif"
              alt="Monochrome interior of the DI CHIES supermarket with stocked shelves"
              className="aspect-4/3 w-full rounded-md border border-border object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: Clock, label: "Same-day pickup", body: "Reserve before 4pm, collect today." },
            { icon: ShieldCheck, label: "Nothing paid upfront", body: "Pay at the collection desk." },
            { icon: ClipboardList, label: "Live stock levels", body: "We only accept what's on the shelf." },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <item.icon className="mt-0.5 size-5" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shop by department</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Every aisle, one click away</h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/categories">View all</Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {(categoriesPending ? Array.from({ length: 10 }) : (categories ?? [])).map((category, index) =>
            category ? (
              <Link
                key={(category as { id: string }).id}
                href={`/categories/${(category as { slug: string }).slug}`}
                className="group overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lift"
              >
                <ProductImage
                  src={(category as { image_url: string | null }).image_url}
                  alt={(category as { name: string }).name}
                  className="aspect-4/3 w-full transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="p-3">
                  <p className="text-sm font-semibold">{(category as { name: string }).name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {(category as { description: string | null }).description}
                  </p>
                </div>
              </Link>
            ) : (
              <div key={index} className="aspect-4/3 animate-pulse rounded-md bg-surface-strong" />
            ),
          )}
        </div>
      </section>

      {!!promotions?.length && (
        <section className="container-page pb-16">
          <div className="grid gap-4 lg:grid-cols-2">
            {promotions.slice(0, 2).map((promotion) => {
              const live = isPromotionLive(promotion);
              const ended = isPromotionEnded(promotion);
              return (
                <article
                  key={promotion.id}
                  className="flex flex-col justify-between gap-6 rounded-md border border-border bg-foreground p-8 text-background"
                >
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] opacity-70">
                      {ended
                        ? "Offer ended"
                        : live
                          ? `Save ${promotion.discount_percent}%`
                          : "Coming soon"}
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-bold">{promotion.title}</h3>
                    <p className="mt-2 max-w-md text-sm opacity-80">{promotion.description}</p>
                  </div>
                  <Button variant="secondary" asChild className="w-fit">
                    <Link href={`/promotions/${promotion.id}`}>
                      {ended ? "View products" : "Shop the offer"}
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="container-page pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Featured this week</h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/shop">Shop all</Link>
          </Button>
        </div>
        <div className="mt-8">
          <ProductGrid
            products={featured.data?.items}
            categories={categories}
            loading={featured.isPending}
            skeletonCount={8}
          />
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16">
        <div className="container-page">
          <p className="eyebrow">How booking works</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Three steps, zero queueing</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="border-t border-foreground pt-5">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-bold">0{index + 1}</span>
                  <step.icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Customer favourites</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Popular right now</h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/shop?sort=popular">
              See more
            </Link>
          </Button>
        </div>
        <div className="mt-8">
          <ProductGrid
            products={popular.data?.items}
            categories={categories}
            loading={popular.isPending}
            skeletonCount={8}
          />
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Just landed</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">New arrivals</h2>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/new-arrivals">All new arrivals</Link>
          </Button>
        </div>
        <div className="mt-8">
          <ProductGrid
            products={fresh.data?.items}
            categories={categories}
            loading={fresh.isPending}
            skeletonCount={4}
          />
        </div>
      </section>
    </SiteLayout>
  );
}


export default HomePage;
