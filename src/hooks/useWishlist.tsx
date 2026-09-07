"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_FIELDS } from "@/lib/queries";
import type { Product } from "@/types/catalog";

type WishlistContextValue = {
  productIds: Set<string>;
  products: Product[];
  count: number;
  loading: boolean;
  isWished: (productId: string) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue>({
  productIds: new Set(),
  products: [],
  count: 0,
  loading: false,
  isWished: () => false,
  toggle: () => {},
  remove: () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const listQuery = useQuery({
    queryKey: ["wishlist", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId!);
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.product_id as string);
      if (ids.length === 0) return { ids, products: [] as Product[] };
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .in("id", ids)
        .eq("is_available", true);
      if (pErr) throw pErr;
      return { ids, products: (products ?? []) as Product[] };
    },
  });

  const productIds = useMemo(
    () => new Set(listQuery.data?.ids ?? []),
    [listQuery.data?.ids],
  );

  const toggleMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (!userId) throw new Error("Sign in required");
      if (productIds.has(product.id)) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", product.id);
        if (error) throw error;
        return { action: "removed" as const, product };
      }
      const { error } = await supabase.from("wishlists").insert({
        user_id: userId,
        product_id: product.id,
      });
      if (error) throw error;
      return { action: "added" as const, product };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist", userId] });
      toast.success(
        result.action === "added"
          ? "Saved to wishlist"
          : "Removed from wishlist",
      );
    },
    onError: (err: Error) => {
      if (err.message === "Sign in required") {
        toast.error("Sign in to save items to your wishlist");
        return;
      }
      toast.error(err.message || "Could not update wishlist");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error("Sign in required");
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist", userId] });
      toast.success("Removed from wishlist");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isWished = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds],
  );

  const toggle = useCallback(
    (product: Product) => {
      if (!userId) {
        toast.error("Sign in to save items to your wishlist");
        return;
      }
      toggleMutation.mutate(product);
    },
    [userId, toggleMutation],
  );

  const remove = useCallback(
    (productId: string) => removeMutation.mutate(productId),
    [removeMutation],
  );

  const value: WishlistContextValue = {
    productIds,
    products: listQuery.data?.products ?? [],
    count: productIds.size,
    loading: listQuery.isLoading,
    isWished,
    toggle,
    remove,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
