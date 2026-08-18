"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { effectivePrice } from "@/lib/format";
import { PRODUCT_FIELDS } from "@/lib/queries";
import type { Product } from "@/types/catalog";

const GUEST_KEY = "dichies-cart";

type Entries = Record<string, number>;

export type CartLine = { product: Product; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue>({
  lines: [],
  count: 0,
  subtotal: 0,
  loading: false,
  addItem: () => {},
  setQuantity: () => {},
  removeItem: () => {},
  clear: () => {},
});

function readGuestCart(): Entries {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? "{}") as Entries;
  } catch {
    return {};
  }
}

function writeGuestCart(entries: Entries) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(entries));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestEntries, setGuestEntries] = useState<Entries>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGuestEntries(readGuestCart());
    setHydrated(true);
  }, []);

  const userId = user?.id ?? null;

  const { data: dbEntries, isLoading: dbLoading } = useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Entries> => {
      const { data, error } = await supabase.from("cart_items").select("product_id,quantity");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.product_id, row.quantity]));
    },
  });

  // Merge the guest cart into the account cart on sign-in.
  useEffect(() => {
    if (!userId || !hydrated) return;
    const pending = readGuestCart();
    if (Object.keys(pending).length === 0) return;
    void (async () => {
      for (const [productId, quantity] of Object.entries(pending)) {
        await supabase
          .from("cart_items")
          .upsert({ user_id: userId, product_id: productId, quantity }, { onConflict: "user_id,product_id" });
      }
      writeGuestCart({});
      setGuestEntries({});
      void queryClient.invalidateQueries({ queryKey: ["cart", userId] });
    })();
  }, [userId, hydrated, queryClient]);

  const entries = userId ? (dbEntries ?? {}) : guestEntries;
  const productIds = useMemo(() => Object.keys(entries), [entries]);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["cart-products", productIds.slice().sort().join(",")],
    enabled: productIds.length > 0,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select(PRODUCT_FIELDS).in("id", productIds);
      if (error) throw error;
      const list = (data ?? []) as Product[];

      // Apply best live promotion % so cart subtotal matches the promo page.
      try {
        const { data: links } = await supabase
          .from("promotion_products")
          .select("product_id, promotion_id")
          .in("product_id", productIds);
        if (!links?.length) return list;

        const promoIds = Array.from(new Set(links.map((l) => l.promotion_id as string)));
        const { data: promos } = await supabase
          .from("promotions")
          .select("id, discount_percent, is_active, starts_at, ends_at")
          .in("id", promoIds);

        const now = Date.now();
        const liveById = new Map<string, number>();
        for (const p of promos ?? []) {
          if (!p.is_active) continue;
          if (p.starts_at && new Date(p.starts_at).getTime() > now) continue;
          if (p.ends_at && new Date(p.ends_at).getTime() <= now) continue;
          liveById.set(p.id, Number(p.discount_percent) || 0);
        }

        const bestPct = new Map<string, number>();
        for (const link of links) {
          const pct = liveById.get(link.promotion_id as string);
          if (pct == null || pct <= 0) continue;
          const pid = link.product_id as string;
          const prev = bestPct.get(pid) ?? 0;
          if (pct > prev) bestPct.set(pid, pct);
        }

        return list.map((product) => {
          const pct = bestPct.get(product.id);
          if (!pct) return product;
          const promoPrice = Number(product.price) * (1 - pct / 100);
          const current = product.discount_price == null ? null : Number(product.discount_price);
          if (current != null && current > 0 && current < promoPrice) return product;
          if (promoPrice >= Number(product.price) || promoPrice <= 0) return product;
          return { ...product, discount_price: Math.round(promoPrice * 100) / 100 };
        });
      } catch {
        return list;
      }
    },
  });

  const persist = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (!userId) return;
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("product_id", productId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("cart_items")
        .upsert({ user_id: userId, product_id: productId, quantity }, { onConflict: "user_id,product_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart", userId] }),
    onError: (error: Error) => toast.error(error.message || "Could not update your cart"),
  });

  const updateEntry = useCallback(
    (productId: string, quantity: number) => {
      if (userId) {
        persist.mutate({ productId, quantity });
        return;
      }
      setGuestEntries((previous) => {
        const next = { ...previous };
        if (quantity <= 0) delete next[productId];
        else next[productId] = quantity;
        writeGuestCart(next);
        return next;
      });
    },
    [persist, userId],
  );

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      const current = entries[product.id] ?? 0;
      updateEntry(product.id, current + quantity);
      toast.success(`${product.name} added to cart`);
    },
    [entries, updateEntry],
  );

  const removeItem = useCallback(
    (productId: string) => {
      updateEntry(productId, 0);
      toast.success("Product removed from cart");
    },
    [updateEntry],
  );

  const clear = useCallback(() => {
    if (userId) {
      void (async () => {
        await supabase.from("cart_items").delete().eq("user_id", userId);
        void queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      })();
    } else {
      writeGuestCart({});
      setGuestEntries({});
    }
  }, [queryClient, userId]);

  const lines = useMemo<CartLine[]>(() => {
    if (!products) return [];
    return products
      .filter((product) => entries[product.id])
      .map((product) => ({ product, quantity: entries[product.id]! }))
      .sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [entries, products]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: Object.values(entries).reduce((sum, quantity) => sum + quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + effectivePrice(line.product) * line.quantity, 0),
      loading: (!!userId && dbLoading) || productsLoading,
      addItem,
      setQuantity: updateEntry,
      removeItem,
      clear,
    }),
    [addItem, clear, dbLoading, entries, lines, productsLoading, removeItem, updateEntry, userId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}