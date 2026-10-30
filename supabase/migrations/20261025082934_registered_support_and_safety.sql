-- Anonymous demo accounts cannot create support or safety cases.
drop policy "owner creates support tickets" on public.support_tickets;
create policy "registered owner creates support tickets" on public.support_tickets for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'open' and
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

drop policy "owner writes support messages" on public.support_messages;
create policy "registered owner writes support messages" on public.support_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false and
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.owner_id = (select auth.uid()) and t.status <> 'resolved'));

drop policy "owner manages blocks" on public.user_blocks;
create policy "registered owner manages blocks" on public.user_blocks for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

drop policy "reporter submits report" on public.post_reports;
create policy "registered reporter submits report" on public.post_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and
    coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);
