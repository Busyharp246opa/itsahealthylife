-- A verified trainer cannot enter either Circle before completing setup.
create or replace function private.current_circle_space()
returns text language sql stable security definer set search_path = '' as $$
  select case
    when exists (
      select 1 from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('coachsphere', 'fitsphere')
    ) then case when exists (
      select 1 from public.profiles p
      join public.trainer_onboarding o on o.user_id = p.user_id
      where p.user_id = (select auth.uid())
        and p.role in ('coachsphere', 'fitsphere')
        and p.is_verified and not o.must_change_password
    ) then 'trainer' else 'unavailable' end
    else 'trainee'
  end;
$$;
revoke all on function private.current_circle_space() from public;
grant execute on function private.current_circle_space() to authenticated;
