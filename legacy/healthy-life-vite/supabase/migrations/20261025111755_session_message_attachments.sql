-- One private attachment per booking message. Paths are conversation/sender/random-id.ext.
alter table public.messages
  add column attachment_path text,
  add column attachment_name text,
  add column attachment_mime text,
  add column attachment_size integer;

alter table public.messages drop constraint messages_body_check;
alter table public.messages add constraint messages_content_check check (
  length(body) <= 4000 and (length(body) > 0 or attachment_path is not null)
);
alter table public.messages add constraint messages_attachment_check check (
  (attachment_path is null and attachment_name is null and attachment_mime is null and attachment_size is null)
  or (
    attachment_path is not null and length(attachment_path) <= 500
    and split_part(attachment_path, '/', 1) = conversation_id::text
    and split_part(attachment_path, '/', 2) = sender_id::text
    and split_part(attachment_path, '/', 3) ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif|pdf|txt|doc|docx)$'
    and split_part(attachment_path, '/', 4) = ''
    and attachment_name is not null and length(attachment_name) between 1 and 255
    and attachment_mime is not null
    and attachment_mime in (
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
      'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    and attachment_size is not null and attachment_size between 1 and 10485760
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-attachments', 'session-attachments', false, 10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
    'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
);

create policy session_attachments_read on storage.objects
  for select to authenticated using (
    bucket_id = 'session-attachments'
    and exists (
      select 1 from public.conversations c
      join public.bookings b on b.id = c.booking_id
      where c.id::text = split_part(name, '/', 1)
        and b.status = 'confirmed'
        and (b.member_id = (select auth.uid()) or b.expert_id = (select auth.uid()))
    )
  );

create policy session_attachments_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'session-attachments'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and exists (
      select 1 from public.conversations c
      join public.bookings b on b.id = c.booking_id
      where c.id::text = split_part(name, '/', 1)
        and b.status = 'confirmed'
        and (b.member_id = (select auth.uid()) or b.expert_id = (select auth.uid()))
    )
  );

create policy session_attachments_delete_orphan on storage.objects
  for delete to authenticated using (
    bucket_id = 'session-attachments'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and not exists (select 1 from public.messages m where m.attachment_path = name)
  );

drop policy messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      join public.bookings b on b.id = c.booking_id
      where c.id = conversation_id and b.status = 'confirmed'
        and (b.member_id = (select auth.uid()) or b.expert_id = (select auth.uid()))
    )
    and (
      attachment_path is null
      or exists (
        select 1 from storage.objects o
        where o.bucket_id = 'session-attachments' and o.name = attachment_path
      )
    )
  );
