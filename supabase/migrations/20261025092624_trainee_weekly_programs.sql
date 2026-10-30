-- Private, repeatable weekly plans. Owner columns on every child allow simple
-- RLS and composite foreign keys prevent attaching another member's records.
create table public.trainee_programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 80),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index trainee_programs_owner_created_idx on public.trainee_programs(owner_id, created_at desc);

create table public.trainee_program_days (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7),
  label text not null default 'Rest day' check (char_length(trim(label)) between 2 and 60),
  unique (program_id, weekday),
  unique (id, owner_id),
  foreign key (program_id, owner_id) references public.trainee_programs(id, owner_id) on delete cascade
);
create index trainee_program_days_owner_program_idx on public.trainee_program_days(owner_id, program_id);

create table public.trainee_exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  target text not null default '' check (char_length(target) <= 80),
  equipment text not null default '' check (char_length(equipment) <= 80),
  instructions text not null default '' check (char_length(instructions) <= 1000),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index trainee_exercises_owner_name_idx on public.trainee_exercises(owner_id, name);

create table public.trainee_program_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  day_id uuid not null,
  catalog_exercise_id text references public.exercise_catalog(id),
  custom_exercise_id uuid,
  position smallint not null check (position between 1 and 40),
  target_sets smallint not null default 3 check (target_sets between 1 and 12),
  target_reps text not null default '8–10' check (char_length(trim(target_reps)) between 1 and 30),
  notes text not null default '' check (char_length(notes) <= 500),
  unique (day_id, position),
  check ((catalog_exercise_id is null) <> (custom_exercise_id is null)),
  foreign key (day_id, owner_id) references public.trainee_program_days(id, owner_id) on delete cascade,
  foreign key (custom_exercise_id, owner_id) references public.trainee_exercises(id, owner_id)
);
create index trainee_program_movements_owner_day_idx on public.trainee_program_movements(owner_id, day_id, position);

create table public.trainee_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 80),
  program_id uuid not null,
  starts_on date not null,
  is_active boolean not null default true,
  share_token uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (program_id, owner_id) references public.trainee_programs(id, owner_id) on delete cascade
);
create unique index trainee_schedules_one_active_per_owner_idx on public.trainee_schedules(owner_id) where is_active;
create index trainee_schedules_owner_created_idx on public.trainee_schedules(owner_id, created_at desc);

create or replace function private.seed_trainee_program_days()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is distinct from (select auth.uid()) then
    raise exception 'Program owner must match signed user';
  end if;
  insert into public.trainee_program_days(owner_id, program_id, weekday)
  select new.owner_id, new.id, n from generate_series(1, 7) n;
  return new;
end;
$$;
revoke all on function private.seed_trainee_program_days() from public;
create trigger seed_trainee_program_days_after_insert after insert on public.trainee_programs
for each row execute function private.seed_trainee_program_days();

alter table public.trainee_programs enable row level security;
alter table public.trainee_program_days enable row level security;
alter table public.trainee_exercises enable row level security;
alter table public.trainee_program_movements enable row level security;
alter table public.trainee_schedules enable row level security;

revoke all on public.trainee_programs, public.trainee_program_days, public.trainee_exercises,
  public.trainee_program_movements, public.trainee_schedules from anon, authenticated;
grant select, insert, delete on public.trainee_programs to authenticated;
grant update (title, description, updated_at) on public.trainee_programs to authenticated;
grant select on public.trainee_program_days to authenticated;
grant update (label) on public.trainee_program_days to authenticated;
grant select, insert, delete on public.trainee_exercises to authenticated;
grant update (name, target, equipment, instructions) on public.trainee_exercises to authenticated;
grant select, insert, delete on public.trainee_program_movements to authenticated;
grant update (position, target_sets, target_reps, notes) on public.trainee_program_movements to authenticated;
grant select, insert, delete on public.trainee_schedules to authenticated;
grant update (title, program_id, starts_on, is_active, share_token, updated_at) on public.trainee_schedules to authenticated;
grant all on public.trainee_programs, public.trainee_program_days, public.trainee_exercises,
  public.trainee_program_movements, public.trainee_schedules to service_role;

create policy "owner or linked trainer reads programs" on public.trainee_programs
  for select to authenticated using (owner_id = (select auth.uid()) or private.can_trainer_read(owner_id));
create policy "owner creates programs" on public.trainee_programs
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner edits programs" on public.trainee_programs
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner deletes programs" on public.trainee_programs
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "owner or linked trainer reads program days" on public.trainee_program_days
  for select to authenticated using (owner_id = (select auth.uid()) or private.can_trainer_read(owner_id));
create policy "owner edits program days" on public.trainee_program_days
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "owner or linked trainer reads custom exercises" on public.trainee_exercises
  for select to authenticated using (owner_id = (select auth.uid()) or private.can_trainer_read(owner_id));
create policy "owner creates custom exercises" on public.trainee_exercises
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner edits custom exercises" on public.trainee_exercises
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner deletes custom exercises" on public.trainee_exercises
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "owner or linked trainer reads program movements" on public.trainee_program_movements
  for select to authenticated using (owner_id = (select auth.uid()) or private.can_trainer_read(owner_id));
create policy "owner creates program movements" on public.trainee_program_movements
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner edits program movements" on public.trainee_program_movements
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner removes program movements" on public.trainee_program_movements
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "owner or linked trainer reads schedules" on public.trainee_schedules
  for select to authenticated using (owner_id = (select auth.uid()) or private.can_trainer_read(owner_id));
create policy "owner creates schedules" on public.trainee_schedules
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner edits schedules" on public.trainee_schedules
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner removes schedules" on public.trainee_schedules
  for delete to authenticated using (owner_id = (select auth.uid()));
