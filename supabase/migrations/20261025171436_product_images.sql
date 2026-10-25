alter table public.products
  add column image_paths text[] not null default '{}'::text[]
  constraint products_image_paths_limit check (cardinality(image_paths) <= 5);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
);

create policy product_images_admin_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images'
    and private.has_role('admin')
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}\.(jpg|png|webp)$'
  );

create policy product_images_admin_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and private.has_role('admin')
  );
