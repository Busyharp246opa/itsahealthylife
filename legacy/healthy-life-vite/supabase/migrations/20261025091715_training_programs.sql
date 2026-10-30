-- Member-authored weekly training. The expert sees only a member-shared program
-- while the two people still have a confirmed or completed booking.
create table public.training_programs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  active boolean not null default false,
  shared_expert_id uuid references public.expert_profiles(user_id) on delete set null,
  schedule jsonb not null default '{}'::jsonb check (jsonb_typeof(schedule) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, member_id)
);
create unique index training_one_active_program_per_member on public.training_programs(member_id) where active;
create index training_programs_shared_expert_idx on public.training_programs(shared_expert_id) where shared_expert_id is not null;

create table public.training_workout_logs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null,
  member_id uuid not null,
  workout_date date not null,
  exercise_instance_id text not null check (char_length(exercise_instance_id) between 1 and 100),
  exercise_name text not null check (char_length(exercise_name) between 1 and 160),
  set_number integer not null check (set_number between 1 and 30),
  reps integer not null check (reps between 1 and 1000),
  weight_kg numeric(7,2) check (weight_kg between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, workout_date, exercise_instance_id, set_number),
  foreign key (program_id, member_id) references public.training_programs(id, member_id) on delete cascade
);
create index training_workout_logs_member_date_idx on public.training_workout_logs(member_id, workout_date desc);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null,
  member_id uuid not null,
  workout_date date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (program_id, workout_date),
  foreign key (program_id, member_id) references public.training_programs(id, member_id) on delete cascade
);
create index training_sessions_member_date_idx on public.training_sessions(member_id, workout_date desc);

create function private.training_booked_expert(p_member_id uuid, p_expert_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bookings b
    where b.member_id = p_member_id and b.expert_id = p_expert_id
      and b.status in ('confirmed', 'completed')
  );
$$;
revoke all on function private.training_booked_expert(uuid, uuid) from public;
grant execute on function private.training_booked_expert(uuid, uuid) to authenticated;

create function private.validate_training_program()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.shared_expert_id is not null and
    (tg_op = 'INSERT' or new.shared_expert_id is distinct from old.shared_expert_id) and
    not private.training_booked_expert(new.member_id, new.shared_expert_id) then
    raise exception 'A program can only be shared with a booked expert';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger training_program_validate before insert or update on public.training_programs
for each row execute function private.validate_training_program();

alter table public.training_programs enable row level security;
alter table public.training_workout_logs enable row level security;
alter table public.training_sessions enable row level security;
revoke all on public.training_programs, public.training_workout_logs, public.training_sessions from anon;
grant select, insert, update, delete on public.training_programs, public.training_workout_logs, public.training_sessions to authenticated;

create policy training_program_read on public.training_programs for select to authenticated
using (member_id = (select auth.uid()) or
  (shared_expert_id = (select auth.uid()) and private.training_booked_expert(member_id, (select auth.uid()))));
create policy training_program_insert on public.training_programs for insert to authenticated
with check (member_id = (select auth.uid()));
create policy training_program_update on public.training_programs for update to authenticated
using (member_id = (select auth.uid())) with check (member_id = (select auth.uid()));
create policy training_program_delete on public.training_programs for delete to authenticated
using (member_id = (select auth.uid()));

create policy training_log_read on public.training_workout_logs for select to authenticated
using (member_id = (select auth.uid()) or exists (
  select 1 from public.training_programs p where p.id = program_id and p.shared_expert_id = (select auth.uid())
    and private.training_booked_expert(p.member_id, (select auth.uid()))));
create policy training_log_insert on public.training_workout_logs for insert to authenticated
with check (member_id = (select auth.uid()) and exists (
  select 1 from public.training_programs p where p.id = program_id and p.member_id = (select auth.uid()) and p.active));
create policy training_log_update on public.training_workout_logs for update to authenticated
using (member_id = (select auth.uid())) with check (member_id = (select auth.uid()));
create policy training_log_delete on public.training_workout_logs for delete to authenticated
using (member_id = (select auth.uid()));

create policy training_session_read on public.training_sessions for select to authenticated
using (member_id = (select auth.uid()) or exists (
  select 1 from public.training_programs p where p.id = program_id and p.shared_expert_id = (select auth.uid())
    and private.training_booked_expert(p.member_id, (select auth.uid()))));
create policy training_session_insert on public.training_sessions for insert to authenticated
with check (member_id = (select auth.uid()) and exists (
  select 1 from public.training_programs p where p.id = program_id and p.member_id = (select auth.uid()) and p.active));
create policy training_session_update on public.training_sessions for update to authenticated
using (member_id = (select auth.uid())) with check (member_id = (select auth.uid()));
create policy training_session_delete on public.training_sessions for delete to authenticated
using (member_id = (select auth.uid()));
