-- Member workflow fields remain owner-scoped even when reached through nested Data API queries.

alter table public.meal_items
  add column quantity numeric(7,2) not null default 1 check (quantity > 0 and quantity <= 10000),
  add column unit text not null default 'serving' check (char_length(unit) between 1 and 32),
  add column source_fdc_id bigint;

create table public.notification_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  reminder_day boolean not null default true,
  reminder_hour boolean not null default true,
  reminder_ten_minutes boolean not null default false,
  weekly_digest boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_touch before update on public.notification_preferences
  for each row execute function public.touch_updated_at();

alter table public.notification_preferences enable row level security;
create policy "users manage own notification preferences" on public.notification_preferences
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;

drop policy "users manage own sets" on public.workout_sets;
create policy "users manage sets in own workouts" on public.workout_sets
  for all to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.owner_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.owner_id = (select auth.uid())
    )
  );

alter table public.workout_sets
  add constraint workout_sets_positive_number check (set_number between 1 and 20),
  add constraint workout_sets_valid_reps check (reps is null or reps between 0 and 100),
  add constraint workout_sets_valid_weight check (weight_kg is null or weight_kg between 0 and 999),
  add constraint workout_sets_valid_rpe check (rpe is null or rpe between 0 and 10);

create index workout_sets_owner_completed_idx on public.workout_sets(owner_id, completed_at desc);
create unique index bookings_active_slot_unique on public.bookings(slot_id)
  where slot_id is not null and status in ('requested', 'confirmed', 'completed');

-- An opt-in, atomic fixture for a new local member. The marker prevents duplicate history.
create table public.member_demo_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  loaded_at timestamptz not null default now()
);
alter table public.member_demo_state enable row level security;
create policy "users read own demo state" on public.member_demo_state
  for select to authenticated using (owner_id = (select auth.uid()));
grant select on public.member_demo_state to authenticated;

create or replace function public.load_member_demo_history()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_id uuid := (select auth.uid());
  workout_id uuid;
  movement_id uuid;
  meal_id uuid;
  day_offset integer;
begin
  if member_id is null then raise exception 'A signed member session is required'; end if;
  if not exists (select 1 from public.feature_flags where key = 'anonymous_local_demo' and enabled) then
    raise exception 'Demo history is disabled';
  end if;
  insert into public.member_demo_state(owner_id) values (member_id) on conflict do nothing;
  if not found then return false; end if;

  for day_offset in 1..7 loop
    insert into public.wellness_checkins(owner_id, checked_on, mood, energy, soreness, sleep_hours, note)
    values (member_id, current_date - day_offset, 3 + (day_offset % 3), 2 + (day_offset % 3), 1 + (day_offset % 3), 6.5 + (day_offset % 3) * 0.5, 'Synthetic sample check-in');
  end loop;

  for day_offset in 1..3 loop
    insert into public.workouts(owner_id, name, status, started_at, completed_at, duration_minutes, notes, is_template)
    values (member_id, 'Sample strength session ' || day_offset, 'completed', now() - make_interval(days => day_offset * 2, mins => 48), now() - make_interval(days => day_offset * 2), 48, 'Synthetic sample workout for exploring charts.', false)
    returning id into workout_id;
    insert into public.workout_exercises(workout_id, exercise_id, position, target_sets, target_reps)
    values (workout_id, '0025', 1, 3, '8') returning id into movement_id;
    insert into public.workout_sets(workout_exercise_id, owner_id, set_number, weight_kg, reps, completed_at)
    values
      (movement_id, member_id, 1, 25 + day_offset * 2, 8, now() - make_interval(days => day_offset * 2)),
      (movement_id, member_id, 2, 25 + day_offset * 2, 8, now() - make_interval(days => day_offset * 2)),
      (movement_id, member_id, 3, 25 + day_offset * 2, 7, now() - make_interval(days => day_offset * 2));
  end loop;

  insert into public.meals(owner_id, meal_type, eaten_at, notes)
  values (member_id, 'breakfast', now() - interval '2 days', 'Synthetic example; values are illustrative.') returning id into meal_id;
  insert into public.meal_items(meal_id, name, quantity, unit, calories, protein_g, carbs_g, fat_g)
  values (meal_id, 'Sample yogurt, oats and berries bowl', 1, 'bowl', 420, 23, 52, 13);

  insert into public.meals(owner_id, meal_type, eaten_at, notes)
  values (member_id, 'lunch', now() - interval '1 day', 'Synthetic example; values are illustrative.') returning id into meal_id;
  insert into public.meal_items(meal_id, name, quantity, unit, calories, protein_g, carbs_g, fat_g)
  values (meal_id, 'Sample chicken, rice and vegetable bowl', 1, 'bowl', 610, 42, 69, 17);

  insert into public.meals(owner_id, meal_type, eaten_at, notes)
  values (member_id, 'dinner', now(), 'Synthetic example; values are illustrative.') returning id into meal_id;
  insert into public.meal_items(meal_id, name, quantity, unit, calories, protein_g, carbs_g, fat_g)
  values (meal_id, 'Sample lentil and vegetable plate', 1, 'plate', 540, 25, 74, 15);

  return true;
end;
$$;
revoke all on function public.load_member_demo_history() from public;
grant execute on function public.load_member_demo_history() to authenticated;

-- Profile owners may edit presentation fields, never their authority or verification.
create or replace function public.protect_profile_authority()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select auth.uid()) is not null and (
    new.id is distinct from old.id or
    new.user_id is distinct from old.user_id or
    new.role is distinct from old.role or
    new.is_verified is distinct from old.is_verified
  ) then
    raise exception 'Profile authority fields cannot be changed by members';
  end if;
  return new;
end;
$$;
create trigger protect_profile_authority_before_update before update on public.profiles
  for each row execute function public.protect_profile_authority();

create policy "operators read data requests" on public.data_requests
  for select to authenticated using (public.is_operator());

create or replace function public.operator_update_case(target_id uuid, next_status public.case_status, note text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid());
declare actor_name text;
begin
  if not public.is_operator() then raise exception 'Operator access required'; end if;
  if char_length(trim(note)) < 3 or char_length(note) > 1000 then raise exception 'A review note of 3 to 1000 characters is required'; end if;
  select display_name into actor_name from public.profiles where user_id = actor_id;
  update public.operations_queue set status = next_status, owner_label = actor_name,
    detail = detail || E'\nOperator note: ' || trim(note)
  where id = target_id;
  if not found then return false; end if;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, metadata)
  values (actor_id, 'case_status_changed', 'operations_queue', target_id::text, jsonb_build_object('status', next_status, 'note', trim(note)));
  return true;
end;
$$;
revoke all on function public.operator_update_case(uuid, public.case_status, text) from public;
grant execute on function public.operator_update_case(uuid, public.case_status, text) to authenticated;

create or replace function public.operator_set_feature_flag(flag_key text, next_enabled boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid());
begin
  if not exists (select 1 from public.profiles where user_id = actor_id and role = 'super_admin') then
    raise exception 'Super admin access required';
  end if;
  if next_enabled and flag_key in ('payment_provider', 'live_video_provider') then
    raise exception 'Provider flags require a connected provider';
  end if;
  update public.feature_flags set enabled = next_enabled, updated_at = now() where key = flag_key;
  if not found then return false; end if;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, metadata)
  values (actor_id, 'feature_flag_changed', 'feature_flags', flag_key, jsonb_build_object('enabled', next_enabled));
  return true;
end;
$$;
revoke all on function public.operator_set_feature_flag(text, boolean) from public;
grant execute on function public.operator_set_feature_flag(text, boolean) to authenticated;

-- A member can remove only the currently signed-in auth identity. Foreign keys
-- cascade through every owner-scoped table, including private demo history.
create or replace function public.delete_my_account(confirmation text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare member_id uuid := (select auth.uid());
begin
  if member_id is null then raise exception 'A signed member session is required'; end if;
  if confirmation is distinct from 'DELETE' then raise exception 'Type DELETE to confirm'; end if;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, metadata)
  values (member_id, 'account_deleted', 'auth.users', member_id::text, jsonb_build_object('self_service', true));
  delete from auth.users where id = member_id;
  return found;
end;
$$;
revoke all on function public.delete_my_account(text) from public;
grant execute on function public.delete_my_account(text) to authenticated;
