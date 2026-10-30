-- Trainee and trainer Circles share a storage model but have separate data
-- audiences. The signed database role, never the presentation role switch,
-- determines the space a person may read and write.
alter table public.posts
  add column circle_space text not null default 'trainee'
  check (circle_space in ('trainee', 'trainer'));

update public.posts p set circle_space = 'trainer', community_id = null, audience = 'public'
where exists (
  select 1 from public.profiles author
  where author.id = p.author_profile_id
    and author.role in ('coachsphere', 'fitsphere')
);

create index posts_circle_space_created_idx
  on public.posts (circle_space, created_at desc);

create or replace function private.current_circle_space()
returns text language sql stable security definer set search_path = '' as $$
  select case when exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('coachsphere', 'fitsphere') and p.is_verified
  ) then 'trainer' else 'trainee' end;
$$;
revoke all on function private.current_circle_space() from public;
grant execute on function private.current_circle_space() to authenticated;

drop policy "posts respect audience and blocks" on public.posts;
create policy "posts stay in the signed circle" on public.posts
  for select to authenticated using (
    public.is_operator() or
    (circle_space = private.current_circle_space() and
      (author_user_id = (select auth.uid()) or
        (status = 'published' and
          (audience = 'public' or (audience = 'community' and exists (
            select 1 from public.communities c where c.id = community_id and
              (not c.is_private or exists (
                select 1 from public.community_members cm
                where cm.community_id = c.id and cm.user_id = (select auth.uid())
              ))
          ))) and not exists (
            select 1 from public.user_blocks b
            where b.owner_id = (select auth.uid()) and b.blocked_user_id = author_user_id
          ))))
  );

drop policy "users create posts" on public.posts;
create policy "users create posts in their circle" on public.posts
  for insert to authenticated with check (
    author_user_id = (select auth.uid()) and
    author_profile_id = public.current_profile_id() and
    circle_space = private.current_circle_space() and
    ((community_id is null and audience = 'public') or
      (circle_space = 'trainee' and audience = 'community' and exists (
        select 1 from public.communities c where c.id = community_id and
          (not c.is_private or exists (
            select 1 from public.community_members cm
            where cm.community_id = c.id and cm.user_id = (select auth.uid())
          ))
      )))
  );

drop policy "users update own posts" on public.posts;
create policy "users update own posts in their circle" on public.posts
  for update to authenticated
  using (author_user_id = (select auth.uid()) and circle_space = private.current_circle_space())
  with check (
    author_user_id = (select auth.uid()) and
    author_profile_id = public.current_profile_id() and
    circle_space = private.current_circle_space()
  );

revoke select on public.posts from anon;
revoke update on public.posts from authenticated;
grant update (title, body, kind, audience, community_id) on public.posts to authenticated;

-- Likes can be read and changed only where the parent post is visible.
drop policy "reactions are readable" on public.post_reactions;
drop policy "users manage own reactions" on public.post_reactions;
create policy "visible post likes are readable" on public.post_reactions
  for select to authenticated using (exists (
    select 1 from public.posts p where p.id = post_id and p.status = 'published'
  ));
create policy "user likes visible posts" on public.post_reactions
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.posts p where p.id = post_id and p.status = 'published'
    )
  );
create policy "user removes own visible likes" on public.post_reactions
  for delete to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.posts p where p.id = post_id and p.status = 'published'
    )
  );
revoke all on public.post_reactions from anon;
revoke update on public.post_reactions from authenticated;

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index post_comments_post_created_idx
  on public.post_comments (post_id, created_at desc);
alter table public.post_comments enable row level security;
revoke all on public.post_comments from anon;

create policy "comments on visible posts are readable" on public.post_comments
  for select to authenticated using (
    exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
    and not exists (
      select 1 from public.user_blocks b
      where b.owner_id = (select auth.uid()) and b.blocked_user_id = author_user_id
    )
  );
create policy "user comments on visible posts" on public.post_comments
  for insert to authenticated with check (
    author_user_id = (select auth.uid()) and
    author_profile_id = public.current_profile_id() and
    exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );
create policy "user removes own comment" on public.post_comments
  for delete to authenticated using (author_user_id = (select auth.uid()));
grant select, insert, delete on public.post_comments to authenticated;
grant all on public.post_comments to service_role;

-- Stored counters now reflect saved likes and comments instead of seed labels.
create or replace function private.refresh_post_social_counts()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_post uuid;
begin
  if tg_op = 'DELETE' then target_post := old.post_id;
  else target_post := new.post_id;
  end if;
  update public.posts p set
    reaction_count = (select count(*)::integer from public.post_reactions r where r.post_id = target_post),
    comment_count = (select count(*)::integer from public.post_comments c where c.post_id = target_post)
  where p.id = target_post;
  if tg_op = 'DELETE' then return old;
  else return new;
  end if;
end;
$$;
revoke all on function private.refresh_post_social_counts() from public;
create trigger post_reactions_refresh_counts
  after insert or delete on public.post_reactions
  for each row execute function private.refresh_post_social_counts();
create trigger post_comments_refresh_counts
  after insert or delete on public.post_comments
  for each row execute function private.refresh_post_social_counts();
update public.posts p set
  reaction_count = (select count(*)::integer from public.post_reactions r where r.post_id = p.id),
  comment_count = (select count(*)::integer from public.post_comments c where c.post_id = p.id);

drop policy "registered reporter submits report" on public.post_reports;
create policy "reporter submits visible post report" on public.post_reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false and
    exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );
