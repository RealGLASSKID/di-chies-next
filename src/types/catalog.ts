import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Subcategory = Database["public"]["Tables"]["subcategories"]["Row"];
export type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingItem = Database["public"]["Tables"]["booking_items"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];