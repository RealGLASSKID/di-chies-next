# DI CHIES — Admin dashboard update

## What you get

- **Side navbar** (desktop sticky + mobile drawer): Dashboard, Bookings, Products, Categories, Promotions, Users
- **Products**: full create/edit for every category, subcategory, price, stock, flags, tags, **image upload** to Supabase Storage (or paste URL)
- **Categories**: create/edit with image upload (route fixed: was `pages.tsx`, now `page.tsx`)
- **Promotions**: new admin page for homepage/deals banners
- Image upload component shared across products, categories, promotions

## Install into your Next.js repo

1. **Backup** your project (or work on a branch).

2. **Copy files** from this package into your project root, matching paths:

```
src/components/admin/AdminShell.tsx          ← replace
src/components/admin/ImageUploadField.tsx    ← new
src/app/admin/products/page.tsx              ← replace
src/app/admin/categories/page.tsx            ← new (correct filename)
src/app/admin/promotions/page.tsx            ← new
```

3. **Delete the broken file** if it still exists:

```
src/app/admin/categories/pages.tsx   ← DELETE (wrong name; Next needs page.tsx)
```

Leave these as they are (already in the package copies if you used the zip fully):

- `src/app/admin/page.tsx`
- `src/app/admin/bookings/page.tsx`
- `src/app/admin/users/page.tsx`

4. **Storage (required for image upload)**  
   Supabase Dashboard → SQL Editor → run **`storage-setup.sql`** once.  
   This creates the public bucket `product-images` and policies.

5. Restart the app:

```bash
npm run dev
```

Open `/admin` while signed in as an **admin** user.

## Make yourself admin (if needed)

In Supabase SQL Editor (replace the email):

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT DO NOTHING;
```

(If your `user_roles` table has a unique constraint on `(user_id, role)`, adjust accordingly.)

## Using product images

1. Admin → **Products** → **Add product**
2. Choose category (all seeded categories appear)
3. Optionally pick subcategory
4. **Upload** an image (JPEG/PNG/WebP, max 2 MB) or switch to **URL** and paste a link
5. Fill price, stock, flags → Create

Images are stored in Supabase Storage (free tier: 1 GB) and the public URL is saved on `products.image_url`.
