-- A single current coach-authored plan per trainee. The existing live sharing
-- relationship is the authority for trainer reads and writes.
create table public.trainer_client_care_plans (
  trainee_id uuid primary key references auth.users(id) on delete cascade,
  trainer_id uuid references auth.users(id) on delete set null,
  training_plan text not null default '' check (char_length(training_plan) <= 4000),
  diet_plan text not null default '' check (char_length(diet_plan) <= 4000),
  recovery_plan text not null default '' check (char_length(recovery_plan) <= 4000),
  other_guidance text not null default '' check (char_length(other_guidance) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trainer_client_care_plans_trainer_id_idx
  on public.trainer_client_care_plans (trainer_id);

alter table public.trainer_client_care_plans enable row level security;

create policy "trainee and current shared trainer read care plan"
  on public.trainer_client_care_plans for select to authenticated
  using (trainee_id = (select auth.uid()) or private.can_trainer_read(trainee_id));

create policy "current shared trainer creates care plan"
  on public.trainer_client_care_plans for insert to authenticated
  with check (trainer_id = (select auth.uid()) and private.can_trainer_read(trainee_id));

create policy "current shared trainer updates care plan"
  on public.trainer_client_care_plans for update to authenticated
  using (private.can_trainer_read(trainee_id))
  with check (trainer_id = (select auth.uid()) and private.can_trainer_read(trainee_id));

-- The owner can read a plan, including after revocation, but cannot author it.
-- Column grants prevent a trainer from moving an existing plan to another trainee.
grant select on public.trainer_client_care_plans to authenticated;
grant insert (trainee_id, trainer_id, training_plan, diet_plan, recovery_plan, other_guidance)
  on public.trainer_client_care_plans to authenticated;
grant update (trainer_id, training_plan, diet_plan, recovery_plan, other_guidance, updated_at)
  on public.trainer_client_care_plans to authenticated;
grant all on public.trainer_client_care_plans to service_role;
