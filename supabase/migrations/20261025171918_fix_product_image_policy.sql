drop policy product_images_admin_insert on storage.objects;

create policy product_images_admin_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images'
    and private.has_role('admin')
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  );
