# DI CHIES — Booking workflow, status history, wishlist & low stock

## What you get

### Admin
- **Status history timeline** on every booking detail (`/admin/bookings/[id]`)
  - Auto-logged on every status change (trigger)
  - Optional note attached when you change status
- **Admin notes** (internal, not shown to customers)
- **Dashboard**: Low-stock card + list (≤ 5 units)
- **Products**: Stock filter — All / Low (≤5) / Out of stock  
  Opens with `?stock=low` from the dashboard

### Customers
- **Fixed My bookings** page with live **status timeline**
- **Wishlist**: heart on product cards, `/account/wishlist`, account menu + account hub links
- Profile notification columns (`notify_booking_updates`, `notify_promotions`) if they were missing

## Install

### 1. Database (required)

Supabase Dashboard → SQL Editor → run the whole file:

```
sql/booking-workflow-schema.sql
```

This creates:
- `bookings.admin_notes`
- `booking_status_history` + auto trigger
- `wishlists`
- profile notify columns
- RLS policies

### 2. Copy files into your Next.js project

Overwrite / add these paths:

```
src/app/admin/bookings/[id]/page.tsx
src/app/admin/page.tsx
src/app/admin/products/page.tsx
src/app/account/bookings/page.tsx
src/app/account/page.tsx
src/app/account/wishlist/page.tsx
src/components/products/ProductCard.tsx
src/components/providers.tsx
src/components/layout/SiteHeader.tsx
src/hooks/useWishlist.tsx
```

### 3. Restart

```bash
npm run dev
```

## How status history works

1. Customer places a booking → history row “Booking created” (pending).
2. Admin changes status on the detail page → new timeline entry (from → to).
3. Optional note in the “Status” card is written onto that new history row.
4. Customer sees the same timeline on **My bookings** (without admin notes).

## Wishlist

- Requires sign-in.
- Heart on product cards toggles save/remove.
- `/account/wishlist` lists saved products.
- Header account menu → Wishlist.

## Notes

- Existing bookings get a seed history row on first SQL run.
- Low-stock threshold is **5** (dashboard + products filter).
- Admin notes never appear on the customer booking view.
