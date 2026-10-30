-- Files are private to conversation members and never exposed through public URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-attachments', 'message-attachments', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  uploader_user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  byte_size integer not null check (byte_size between 1 and 10485760),
  created_at timestamptz not null default now()
);

create index message_attachments_message_idx on public.message_attachments(message_id);
alter table public.message_attachments enable row level security;
grant select, insert on public.message_attachments to authenticated;
alter publication supabase_realtime add table public.message_attachments;

create policy "accessible attachments are readable" on public.message_attachments
for select to authenticated using (public.can_access_conversation(conversation_id));

create policy "message senders attach files" on public.message_attachments
for insert to authenticated with check (
  uploader_user_id = (select auth.uid())
  and exists (
    select 1 from public.messages m
    where m.id = message_id and m.conversation_id = message_attachments.conversation_id
      and m.sender_user_id = (select auth.uid())
  )
  and public.can_access_conversation(conversation_id)
  and storage_path like conversation_id::text || '/' || uploader_user_id::text || '/%'
);

create policy "conversation members download message files" on storage.objects
for select to authenticated using (
  bucket_id = 'message-attachments' and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and public.can_access_conversation(c.id)
  )
);

create policy "conversation members upload message files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and public.can_access_conversation(c.id)
  )
);

create policy "uploaders remove message files" on storage.objects
for delete to authenticated using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
