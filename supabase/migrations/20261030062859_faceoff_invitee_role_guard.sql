-- Direct API clients must obey the same public-profile and Circle boundary as
-- the application form when choosing a person to challenge.
drop policy "members create faceoffs in their circle" on public.faceoff_matches;
create policy "members create faceoffs in their circle" on public.faceoff_matches
for insert to authenticated with check (
  creator_user_id = (select auth.uid()) and circle_space = private.current_circle_space()
  and opponent_user_id is null and target_date between current_date and current_date + 366
  and ((status = 'open' and invitee_user_id is null) or
       (status = 'invited' and invitee_user_id is not null and exists (
         select 1 from public.profiles target
         where target.user_id = invitee_user_id and target.is_public
           and ((circle_space = 'trainee' and target.role = 'member') or
                (circle_space = 'trainer' and target.role in ('coachsphere', 'fitsphere') and target.is_verified))
       )))
);
