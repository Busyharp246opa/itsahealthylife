-- Dated spotlight display follows the same Dubai calendar used by the member dashboard.
drop policy "current verified spotlights are visible" on public.coach_spotlights;
create policy "current verified spotlights are visible" on public.coach_spotlights for select to anon, authenticated
  using (is_active and starts_on <= (now() at time zone 'Asia/Dubai')::date
    and ends_on >= (now() at time zone 'Asia/Dubai')::date and exists (
      select 1 from public.coach_profiles c where c.id = coach_id and c.verified_at is not null
    ));
