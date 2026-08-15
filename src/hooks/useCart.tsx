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
  isAdmin: boolean;
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
  isAdmin: false,
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
  const { user, isAdmin } = useAuth();
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
      return (data ?? []) as Product[];
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
      if (isAdmin) {
        toast.error("You're signed in as the store admin — bookings are for customers only.");
        return;
      }
      const current = entries[product.id] ?? 0;
      updateEntry(product.id, current + quantity);
      toast.success(`${product.name} added to cart`);
    },
    [entries, isAdmin, updateEntry],
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
      isAdmin,
      addItem,
      setQuantity: updateEntry,
      removeItem,
      clear,
    }),
    [addItem, clear, dbLoading, entries, isAdmin, lines, productsLoading, removeItem, updateEntry, userId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}