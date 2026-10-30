-- Registration, private trainer review, and explicit trainee-to-trainer sharing.
create table public.trainer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null,
  phone text not null default '',
  bio text not null default '',
  specialties text[] not null default '{}',
  certificate_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.trainer_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  source text not null check (source in ('application','admin')),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.trainee_details (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  coaching_opt_in boolean not null default false,
  share_with_trainer boolean not null default false,
  fitness_goals text not null default '',
  fitness_level text not null default '',
  training_preferences text not null default '',
  diet_preferences text not null default '',
  diet_notes text not null default '',
  wellness_notes text not null default '',
  updated_at timestamptz not null default now()
);
create table public.trainer_client_links (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (trainee_id, trainer_id),
  check (trainee_id <> trainer_id)
);
create index trainer_client_links_trainer_active on public.trainer_client_links(trainer_id) where active;

alter table public.trainer_applications enable row level security;
alter table public.trainer_onboarding enable row level security;
alter table public.trainee_details enable row level security;
alter table public.trainer_client_links enable row level security;

create policy "applicants and operators read trainer applications" on public.trainer_applications
  for select to authenticated using (applicant_id = (select auth.uid()) or public.is_operator());
create policy "trainer reads onboarding" on public.trainer_onboarding
  for select to authenticated using (user_id = (select auth.uid()) or public.is_operator());
create policy "trainee reads own details" on public.trainee_details
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "trainee writes own details" on public.trainee_details
  for all to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- The policy helper looks at current database rows, so revoking sharing takes effect without JWT refresh.
create schema if not exists private;
create or replace function private.can_trainer_read(target_trainee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trainer_client_links l
    join public.trainee_details d on d.owner_id = l.trainee_id
    join public.profiles p on p.user_id = l.trainer_id
    join public.trainer_onboarding o on o.user_id = l.trainer_id
    where l.trainee_id = target_trainee and l.trainer_id = (select auth.uid())
      and l.active and d.share_with_trainer and p.role = 'coachsphere'
      and p.is_verified and not o.must_change_password
  );
$$;
revoke all on function private.can_trainer_read(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.can_trainer_read(uuid) to authenticated;

create policy "shared trainee details for linked trainer" on public.trainee_details
  for select to authenticated using (private.can_trainer_read(owner_id));
create policy "shared trainee profile for linked trainer" on public.profiles
  for select to authenticated using (private.can_trainer_read(user_id));
create policy "shared trainee goals for linked trainer" on public.goals
  for select to authenticated using (private.can_trainer_read(owner_id));
create policy "shared trainee workouts for linked trainer" on public.workouts
  for select to authenticated using (private.can_trainer_read(owner_id));
create policy "shared trainee workout exercises for linked trainer" on public.workout_exercises
  for select to authenticated using (exists (select 1 from public.workouts w where w.id = workout_id and private.can_trainer_read(w.owner_id)));
create policy "shared trainee sets for linked trainer" on public.workout_sets
  for select to authenticated using (private.can_trainer_read(owner_id));
create policy "shared trainee meals for linked trainer" on public.meals
  for select to authenticated using (private.can_trainer_read(owner_id));
create policy "shared trainee food for linked trainer" on public.meal_items
  for select to authenticated using (exists (select 1 from public.meals m where m.id = meal_id and private.can_trainer_read(m.owner_id)));
create policy "shared trainee wellness for linked trainer" on public.wellness_checkins
  for select to authenticated using (private.can_trainer_read(owner_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trainer-certificates', 'trainer-certificates', false, 5242880,
  array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;
-- Certificate objects are handled only by the server's service client after identity checks.

grant select on public.trainer_applications, public.trainer_onboarding to authenticated;
grant select, insert, update, delete on public.trainee_details, public.trainer_client_links to authenticated;
grant all on public.trainer_applications, public.trainer_onboarding, public.trainee_details, public.trainer_client_links to service_role;

create or replace function private.create_trainee_details_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'registration_role', '') = 'trainee' then
    insert into public.trainee_details(owner_id, coaching_opt_in)
    values (new.id, coalesce((new.raw_user_meta_data ->> 'coaching_opt_in')::boolean, false))
    on conflict (owner_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger create_trainee_details_after_signup after insert on auth.users
  for each row execute function private.create_trainee_details_for_new_user();

-- Trainers see relationship rows only while all three sharing categories are enabled.
create policy "linked parties read relationship" on public.trainer_client_links
  for select to authenticated using (trainee_id = (select auth.uid()) or
    (trainer_id = (select auth.uid()) and private.can_trainer_read(trainee_id)));

-- Trainees cannot directly read trainer onboarding rows; the link validator performs
-- this one authoritative check without exposing those rows to the browser.
create or replace function private.is_approved_trainer(target_trainer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.trainer_onboarding o on o.user_id = p.user_id
    where p.user_id = target_trainer and p.role = 'coachsphere'
      and p.is_verified and not o.must_change_password
  );
$$;
revoke all on function private.is_approved_trainer(uuid) from public;
grant execute on function private.is_approved_trainer(uuid) to authenticated;
create policy "trainee creates approved relationship" on public.trainer_client_links
  for insert to authenticated with check (trainee_id = (select auth.uid()) and private.is_approved_trainer(trainer_id));
create policy "trainee updates relationship" on public.trainer_client_links
  for update to authenticated using (trainee_id = (select auth.uid()))
  with check (trainee_id = (select auth.uid()) and (not active or private.is_approved_trainer(trainer_id)));
create policy "trainee deletes relationship" on public.trainer_client_links
  for delete to authenticated using (trainee_id = (select auth.uid()));
