-- The member home may show public posts from verified coaches without opening
-- trainer-only Circle content or private/community audiences.
create policy "members read public coach posts on home" on public.posts
  for select to authenticated using (
    circle_space = 'trainer'
    and status = 'published'
    and audience = 'public'
    and community_id is null
    and private.current_circle_space() = 'trainee'
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from public.profiles author
      where author.id = author_profile_id
        and author.role in ('fitsphere', 'coachsphere')
        and author.is_verified
        and author.is_public
    )
    and not exists (
      select 1 from public.user_blocks b
      where b.owner_id = (select auth.uid())
        and b.blocked_user_id = author_user_id
    )
  );

-- Replies belong to a comment on the same post. One visible reply level keeps
-- threads readable on narrow screens and prevents arbitrary parent chains.
alter table public.post_comments
  add column parent_comment_id uuid;

alter table public.post_comments
  add constraint post_comments_id_post_id_unique unique (id, post_id);

alter table public.post_comments
  add constraint post_comments_parent_same_post_fkey
  foreign key (parent_comment_id, post_id)
  references public.post_comments (id, post_id)
  on delete cascade;

create index post_comments_parent_created_idx
  on public.post_comments (parent_comment_id, created_at);

create function private.validate_post_comment_reply()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_comment_id is not null and not exists (
    select 1 from public.post_comments parent
    where parent.id = new.parent_comment_id
      and parent.post_id = new.post_id
      and parent.parent_comment_id is null
  ) then
    raise exception 'Replies must belong to a top-level comment on the same post'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_post_comment_reply() from public;

create trigger post_comments_validate_reply
  before insert on public.post_comments
  for each row execute function private.validate_post_comment_reply();
