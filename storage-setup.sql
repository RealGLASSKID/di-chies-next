-- =============================================================================
-- DI CHIES — Supabase Storage setup for product / category / promotion images
-- Run once in Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1) Create public bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2) Public read
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3) Authenticated users can upload (admin app is signed-in)
DROP POLICY IF EXISTS "Auth upload product-images" ON storage.objects;
CREATE POLICY "Auth upload product-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- 4) Authenticated users can update / overwrite
DROP POLICY IF EXISTS "Auth update product-images" ON storage.objects;
CREATE POLICY "Auth update product-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- 5) Authenticated users can delete
DROP POLICY IF EXISTS "Auth delete product-images" ON storage.objects;
CREATE POLICY "Auth delete product-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Done. Test: Admin → Products → Add product → Upload image.
