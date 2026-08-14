"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOutCompletely, useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { categoriesQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/deals", label: "Deals" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/about", label: "About" },
] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-bold tracking-[0.18em] uppercase", className)}>
      DI&nbsp;CHIES
    </span>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { count } = useCart();
  const { user, profile, isAdmin } = useAuth();
  const { data: categories } = useQuery(categoriesQuery);
  const [term, setTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = term.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  async function handleSignOut() {
    await signOutCompletely(queryClient);
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-page flex h-16 items-center gap-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle>
                <Wordmark />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  className="rounded-sm px-3 py-3 text-sm font-medium hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/cart" className="rounded-sm px-3 py-3 text-sm font-medium hover:bg-accent">
                Cart ({count})
              </Link>
              <Link
                href={user ? "/account" : "/login"}
                className="rounded-sm px-3 py-3 text-sm font-medium hover:bg-accent"
              >
                {user ? "My Account" : "Sign in"}
              </Link>
            </nav>
            <div className="border-t border-border px-5 py-4">
              <p className="eyebrow mb-3">Departments</p>
              <ul className="space-y-1">
                {categories?.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="block rounded-sm px-1 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-4">
              <span className="text-sm text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" aria-label="DI CHIES home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className="rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:block" role="search">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="site-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search products, brands…"
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" asChild className="md:hidden" aria-label="Search">
            <Link href="/search">
              <Search className="size-5" aria-hidden />
            </Link>
          </Button>
          <ThemeToggle className="hidden md:inline-flex" />
          <Button variant="ghost" size="icon" asChild className="relative" aria-label={`Cart, ${count} items`}>
            <Link href="/cart">
              <ShoppingBag className="size-5" aria-hidden />
              {count > 0 && (
                <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">
                  {count > 99 ? "99+" : count}
                </Badge>
              )}
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <User className="size-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate">
                    {profile?.full_name || user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">My account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/bookings">My bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings">Settings</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <LayoutDashboard className="mr-2 size-4" aria-hidden />
                          Admin console
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void handleSignOut()}>
                    <LogOut className="mr-2 size-4" aria-hidden />
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>Welcome to DI CHIES</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Create account</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="hidden border-t border-border lg:block">
        <div className="container-page flex h-10 items-center gap-6 overflow-x-auto">
          {categories?.slice(0, 9).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/categories" className="whitespace-nowrap text-xs font-semibold">
            All departments →
          </Link>
        </div>
      </div>
    </header>
  );
}
