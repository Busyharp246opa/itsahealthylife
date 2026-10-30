-- Keep the public community path independent from membership records.
-- Anonymous page renders must not need privileges on community_members merely
-- to decide that a public community is visible.
drop policy if exists "public communities are readable" on public.communities;

create policy "public communities are readable by guests"
on public.communities
for select
to anon
using (not is_private);

create policy "communities are readable by signed in members"
on public.communities
for select
to authenticated
using (
  not is_private
  or exists (
    select 1
    from public.community_members cm
    where cm.community_id = id
      and cm.user_id = (select auth.uid())
  )
);
