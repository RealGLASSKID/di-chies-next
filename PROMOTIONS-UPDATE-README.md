# DI CHIES — Promotions linked to products

## What changed

Promotions are no longer generic banners that dump customers on `/deals`.

Each promotion now:

1. Has **one discount %** for every product in it  
2. Has a **selected list of products** (a product can be in more than one promotion)  
3. Opens a **dedicated page** `/promotions/[id]` with only those products  
4. Applies that % on the promo page (and in the cart while the promo is live)  
5. When the end date passes, the offer **stays visible** but shows **“Ended”** (no discount)  
6. **Today’s Deals** (`/deals`) is unchanged — still the general discounted-product list  

## Install

### 1. Database (required)

Supabase Dashboard → SQL Editor → run:

```
promotion-products-schema.sql
```

This creates `promotion_products` and allows the public to read all promotions (so ended ones can still display).

### 2. Copy files into your Next.js project

```
src/components/admin/AdminShell.tsx
src/components/admin/ImageUploadField.tsx
src/app/admin/promotions/page.tsx
src/app/promotions/[id]/page.tsx
src/app/page.tsx
src/components/products/ProductCard.tsx
src/hooks/useCart.tsx
src/lib/format.ts
src/lib/queries.ts
```

If you already installed the earlier **admin-update** package, you already have `AdminShell` and `ImageUploadField` — overwrite with these copies.

### 3. Restart

```bash
npm run dev
```

## How to use (admin)

1. Sign in as admin → **Promotions**  
2. **Add promotion**  
3. Title, description, **one discount %**, end date, banner image  
4. **Search and tick the products** that belong to this offer  
5. Save  

Homepage cards link to `/promotions/{id}`. Customers only see those products and get the promo % while the offer is live.

## Behaviour notes

| Situation | Behaviour |
|-----------|-----------|
| Promo live | Discount applied on promo page + cart |
| Promo past `ends_at` | Page still open, badge “Ended”, regular prices, no add-from-promo discount |
| Product in 2 live promos | Cart uses the **higher** % |
| Product also has `discount_price` | Best of product discount vs promo % |
| `/deals` | Unchanged (products with `discount_price` set) |

## Optional

- Hide an old promo completely: turn **Active on storefront** off in admin (or delete it).  
- Ended promos remain listed while Active is on, so customers can still open them and see what was offered.
