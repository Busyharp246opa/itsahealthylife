-- Social posts can carry one private image or short video. The post row remains
-- the authority for who may fetch its media through the application route.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

alter table public.posts
  add column media_path text,
  add column media_type text,
  add column media_alt text not null default '',
  add constraint posts_media_type_check check (
    (media_path is null and media_type is null and media_alt = '') or
    (media_path is not null and media_type in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm')
      and char_length(media_alt) <= 240
      and media_path like author_user_id::text || '/%')
  );
alter table public.posts drop constraint if exists posts_body_check;
alter table public.posts add constraint posts_body_check
  check (char_length(body) between 1 and 5000 or (body = '' and media_path is not null));

create policy "members upload own post media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "visible post media can be read" on storage.objects
for select to authenticated using (
  bucket_id = 'post-media' and exists (
    select 1 from public.posts p where p.media_path = name and p.status = 'published'
  )
);
create policy "members remove own post media" on storage.objects
for delete to authenticated using (
  bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- A direct invitation names a member; an open match can be claimed by one
-- member in the same Circle. No automatic reward or result adjudication runs.
create table public.faceoff_matches (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid references auth.users(id) on delete cascade,
  opponent_user_id uuid references auth.users(id) on delete cascade,
  circle_space text not null check (circle_space in ('trainee', 'trainer')),
  goal text not null check (char_length(goal) between 8 and 240),
  target_date date not null,
  status text not null check (status in ('open', 'invited', 'active', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  check (invitee_user_id is null or invitee_user_id <> creator_user_id),
  check (opponent_user_id is null or opponent_user_id <> creator_user_id),
  check ((status = 'open' and invitee_user_id is null and opponent_user_id is null)
      or (status = 'invited' and invitee_user_id is not null and opponent_user_id is null)
      or (status = 'active' and opponent_user_id is not null)
      or status in ('declined', 'cancelled'))
);
create index faceoff_matches_open_idx on public.faceoff_matches (circle_space, created_at desc) where status = 'open';
create index faceoff_matches_creator_idx on public.faceoff_matches (creator_user_id, created_at desc);
create index faceoff_matches_invitee_idx on public.faceoff_matches (invitee_user_id, created_at desc);
alter table public.faceoff_matches enable row level security;
grant select, insert on public.faceoff_matches to authenticated;
grant update (status, opponent_user_id) on public.faceoff_matches to authenticated;

create policy "circle members find open or own faceoffs" on public.faceoff_matches
for select to authenticated using (
  circle_space = private.current_circle_space() and
  (status = 'open' or creator_user_id = (select auth.uid()) or
   invitee_user_id = (select auth.uid()) or opponent_user_id = (select auth.uid()))
);
create policy "members create faceoffs in their circle" on public.faceoff_matches
for insert to authenticated with check (
  creator_user_id = (select auth.uid()) and circle_space = private.current_circle_space()
  and opponent_user_id is null and target_date >= current_date
  and ((status = 'open' and invitee_user_id is null) or
       (status = 'invited' and invitee_user_id is not null))
);
create policy "participants answer or cancel faceoffs" on public.faceoff_matches
for update to authenticated
using (
  circle_space = private.current_circle_space() and
  ((creator_user_id = (select auth.uid()) and status in ('open', 'invited')) or
   (status = 'open' and invitee_user_id is null and creator_user_id <> (select auth.uid())) or
   (status = 'invited' and invitee_user_id = (select auth.uid())))
)
with check (
  circle_space = private.current_circle_space() and
  ((status = 'active' and opponent_user_id = (select auth.uid()) and
    (invitee_user_id is null or invitee_user_id = (select auth.uid()))) or
   (status = 'declined' and invitee_user_id = (select auth.uid()) and opponent_user_id is null) or
   (status = 'cancelled' and creator_user_id = (select auth.uid()) and opponent_user_id is null))
);
