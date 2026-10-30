-- Only end-user accounts receive public coach posts through the mixed home feed.
alter policy "members read public coach posts on home" on public.posts
  using (
    circle_space = 'trainer'
    and status = 'published'
    and audience = 'public'
    and community_id is null
    and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from public.profiles viewer
      where viewer.user_id = (select auth.uid())
        and viewer.role = 'member'
    )
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
