"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ClipboardList,
  Users,
  Store,
  LogOut,
  Menu,
  X,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useAuth, signOutCompletely } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminShell({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, isAdmin, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOutCompletely(queryClient);
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <EmptyState
          title="Admin access required"
          description="Sign in with a staff account that has the admin role."
          action={
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const Sidebar = (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Store className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold tracking-[0.12em] uppercase leading-none">
            DI CHIES
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin console
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Manage
        </p>
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <div className="mb-2 rounded-md bg-muted/50 px-3 py-2">
          <p className="truncate text-sm font-medium">
            {profile?.full_name || user.email}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
          <Link href="/" target="_blank">
            <Store className="mr-2 size-4" />
            View storefront
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border lg:block">
        {Sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-md p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}