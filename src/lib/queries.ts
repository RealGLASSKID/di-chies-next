import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Category, Product, Promotion, Subcategory } from "@/types/catalog";

export const PRODUCT_FIELDS =
  "id,name,slug,description,brand,price,discount_price,image_url,additional_images,sku,stock_quantity,is_available,unit,tags,is_featured,is_popular,is_new_arrival,age_restricted,category_id,subcategory_id,created_at,updated_at";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const subcategoriesQuery = queryOptions({
  queryKey: ["subcategories"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Subcategory[]> => {
    const { data, error } = await supabase
      .from("subcategories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const promotionsQuery = queryOptions({
  queryKey: ["promotions"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Promotion[]> => {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .order("created_at");
    if (error) throw error;
    return data;
  },
});

export type ProductSort = "newest" | "popular" | "price-asc" | "price-desc" | "name-asc";

export type ProductFilters = {
  categorySlug?: string | undefined;
  subcategoryId?: string | undefined;
  search?: string | undefined;
  brands?: string[];
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  inStockOnly?: boolean;
  discountedOnly?: boolean;
  featuredOnly?: boolean;
  popularOnly?: boolean;
  newOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export function productsQuery(filters: ProductFilters) {
  const pageSize = filters.pageSize ?? 24;
  const page = filters.page ?? 1;

  return queryOptions({
    queryKey: ["products", filters],
    queryFn: async (): Promise<{ items: Product[]; total: number }> => {
      let categoryId: string | undefined;
      if (filters.categorySlug) {
        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", filters.categorySlug)
          .maybeSingle();
        if (categoryError) throw categoryError;
        if (!category) return { items: [], total: 0 };
        categoryId = category.id;
      }

      let query = supabase.from("products").select(PRODUCT_FIELDS, { count: "exact" });

      if (categoryId) query = query.eq("category_id", categoryId);
      if (filters.subcategoryId) query = query.eq("subcategory_id", filters.subcategoryId);
      if (filters.brands?.length) query = query.in("brand", filters.brands);
      if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
      if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
      if (filters.inStockOnly) query = query.gt("stock_quantity", 0).eq("is_available", true);
      if (filters.discountedOnly) query = query.not("discount_price", "is", null);
      if (filters.featuredOnly) query = query.eq("is_featured", true);
      if (filters.popularOnly) query = query.eq("is_popular", true);
      if (filters.newOnly) query = query.eq("is_new_arrival", true);
      if (filters.search) {
        const term = filters.search.replace(/[%,()]/g, " ").trim();
        if (term) {
          query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`);
        }
      }

      switch (filters.sort ?? "newest") {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "name-asc":
          query = query.order("name", { ascending: true });
          break;
        case "popular":
          query = query.order("is_popular", { ascending: false }).order("name");
          break;
        default:
          query = query.order("created_at", { ascending: false }).order("name");
      }

      const from = (page - 1) * pageSize;
      const { data, error, count } = await query.range(from, from + pageSize - 1);
      if (error) throw error;
      return { items: (data ?? []) as Product[], total: count ?? 0 };
    },
  });
}

export function productBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as Product) ?? null;
    },
  });
}

export function brandsQuery(categorySlug?: string) {
  return queryOptions({
    queryKey: ["brands", categorySlug ?? "all"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<string[]> => {
      let categoryId: string | undefined;
      if (categorySlug) {
        const { data } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .maybeSingle();
        categoryId = data?.id;
      }
      let query = supabase.from("products").select("brand").order("brand");
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((row) => row.brand).filter(Boolean)));
    },
  });
}