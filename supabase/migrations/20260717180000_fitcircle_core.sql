create extension if not exists pgcrypto with schema extensions;

create type public.profile_role as enum (
  'member',
  'coachsphere',
  'fitsphere',
  'moderator',
  'support',
  'finance_admin',
  'catalog_admin',
  'super_admin'
);

create type public.workout_status as enum ('draft', 'scheduled', 'active', 'completed', 'cancelled');
create type public.booking_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type public.case_status as enum ('open', 'review', 'resolved', 'dismissed');
create type public.content_status as enum ('draft', 'published', 'hidden', 'removed');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,32}$'),
  display_name text not null check (char_length(display_name) between 2 and 80),
  initials text not null check (char_length(initials) between 1 and 4),
  role public.profile_role not null default 'member',
  headline text not null default '',
  location text not null default '',
  bio text not null default '',
  avatar_tone text not null default 'member',
  is_verified boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('wellness_personalization', 'coach_readiness', 'marketing', 'research')),
  granted boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, scope)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_value numeric(10,2),
  current_value numeric(10,2) not null default 0,
  unit text not null default '',
  due_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.exercise_catalog (
  id text primary key,
  name text not null,
  body_part text not null,
  equipment text not null,
  target text not null,
  muscle_group text not null,
  secondary_muscles text[] not null default '{}',
  instructions text not null,
  steps text[] not null default '{}',
  content_hash text not null,
  source_commit text not null default '7455efae',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(body_part, '') || ' ' || coalesce(target, '') || ' ' || coalesce(equipment, ''))
  ) stored
);

create index exercise_catalog_search_idx on public.exercise_catalog using gin(search_document);
create index exercise_catalog_body_part_idx on public.exercise_catalog(body_part);
create index exercise_catalog_equipment_idx on public.exercise_catalog(equipment);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text not null,
  level text not null,
  weeks smallint not null check (weeks between 1 and 52),
  sessions_per_week smallint not null check (sessions_per_week between 1 and 14),
  accent text not null default 'cyan',
  status public.content_status not null default 'published',
  created_at timestamptz not null default now()
);

create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week_number smallint not null,
  day_number smallint not null,
  title text not null,
  duration_minutes smallint not null,
  focus text not null,
  unique(program_id, week_number, day_number)
);

create table public.program_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  exercise_id text not null references public.exercise_catalog(id),
  position smallint not null,
  target_sets smallint not null default 3,
  target_reps text not null default '8-10',
  rest_seconds smallint not null default 90,
  unique(session_id, position)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  status public.workout_status not null default 'draft',
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  duration_minutes smallint,
  notes text not null default '',
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_template and owner_id is null) or (not is_template and owner_id is not null))
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id text not null references public.exercise_catalog(id),
  position smallint not null,
  target_sets smallint not null default 3,
  target_reps text not null default '8-10',
  rest_seconds smallint not null default 90,
  notes text not null default '',
  unique(workout_id, position)
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  set_number smallint not null,
  weight_kg numeric(7,2),
  reps smallint,
  rpe numeric(3,1),
  is_warmup boolean not null default false,
  completed_at timestamptz,
  unique(workout_exercise_id, set_number)
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  topic text not null,
  member_count integer not null default 0,
  post_count integer not null default 0,
  accent text not null default 'cyan',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('member', 'moderator', 'owner')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid references public.profiles(id) on delete set null,
  author_user_id uuid references auth.users(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  title text not null default '',
  body text not null check (char_length(body) between 1 and 5000),
  audience text not null default 'public' check (audience in ('public', 'followers', 'community')),
  status public.content_status not null default 'published',
  kind text not null default 'note' check (kind in ('note', 'milestone', 'coach_tip', 'class', 'question')),
  reaction_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts(created_at desc);
create index posts_community_idx on public.posts(community_id, created_at desc);

create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like' check (reaction in ('like', 'strong', 'inspired')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  coaching_type text not null check (coaching_type in ('coachsphere', 'fitsphere')),
  specialties text[] not null default '{}',
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  session_count integer not null default 0,
  currency text not null default 'USD',
  base_price integer not null,
  response_hours smallint not null default 24,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.coach_packages (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  name text not null,
  description text not null,
  duration_weeks smallint not null,
  session_count smallint not null,
  price integer not null,
  currency text not null default 'USD',
  is_active boolean not null default true
);

create table public.coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Asia/Dubai',
  is_booked boolean not null default false,
  check (ends_at > starts_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references public.coach_profiles(id),
  package_id uuid references public.coach_packages(id),
  slot_id uuid references public.coach_availability(id),
  status public.booking_status not null default 'requested',
  starts_at timestamptz not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  mood smallint not null check (mood between 1 and 5),
  energy smallint not null check (energy between 1 and 5),
  sleep_hours numeric(3,1) check (sleep_hours between 0 and 24),
  soreness smallint not null check (soreness between 1 and 5),
  note text not null default '',
  checked_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (owner_id, checked_on)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  body text not null,
  mood smallint check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten_at timestamptz not null default now(),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  calories integer check (calories >= 0),
  protein_g numeric(6,1) check (protein_g >= 0),
  carbs_g numeric(6,1) check (carbs_g >= 0),
  fat_g numeric(6,1) check (fat_g >= 0)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  metric text not null,
  target numeric(12,2) not null,
  unit text not null,
  starts_on date not null,
  ends_on date not null,
  participant_count integer not null default 0,
  reward_coins integer not null default 0,
  accent text not null default 'orange',
  status public.content_status not null default 'published',
  check (ends_on >= starts_on)
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  progress numeric(12,2) not null default 0,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  kind text not null default 'direct' check (kind in ('direct', 'group', 'support')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  muted_until timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  sender_user_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'sent' check (status in ('sending', 'sent', 'read', 'removed')),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  product_type text not null check (product_type in ('subscription', 'program', 'digital', 'merch')),
  price integer not null,
  currency text not null default 'USD',
  coin_price integer,
  accent text not null default 'cyan',
  is_active boolean not null default true
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'full_circle', 'coach')),
  status text not null check (status in ('active', 'trialing', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  transaction_type text not null check (transaction_type in ('earned', 'spent', 'refund', 'adjustment')),
  description text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.operations_queue (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  area text not null,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status public.case_status not null default 'open',
  owner_label text not null default 'Unassigned',
  detail text not null,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feature_flags (
  key text primary key,
  description text not null,
  enabled boolean not null default false,
  audience text not null default 'all',
  updated_at timestamptz not null default now()
);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('export', 'delete', 'correct')),
  status text not null default 'requested' check (status in ('requested', 'processing', 'ready', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
begin
  base_handle := 'member_' || substr(replace(new.id::text, '-', ''), 1, 10);
  insert into public.profiles (id, user_id, handle, display_name, initials, role, headline, is_public)
  values (
    new.id,
    new.id,
    base_handle,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Local member'),
    'LM',
    'member',
    'Building consistency',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p where p.user_id = (select auth.uid()) limit 1;
$$;

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('moderator', 'support', 'finance_admin', 'catalog_admin', 'super_admin')
  );
$$;

create or replace function public.can_access_conversation(target_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = target_conversation and c.is_demo
  ) or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = target_conversation and cm.user_id = (select auth.uid())
  );
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger workouts_touch before update on public.workouts for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();
create trigger journal_entries_touch before update on public.journal_entries for each row execute function public.touch_updated_at();
create trigger conversations_touch before update on public.conversations for each row execute function public.touch_updated_at();
create trigger operations_queue_touch before update on public.operations_queue for each row execute function public.touch_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.consent_grants enable row level security;
alter table public.goals enable row level security;
alter table public.exercise_catalog enable row level security;
alter table public.programs enable row level security;
alter table public.program_sessions enable row level security;
alter table public.program_session_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.coach_profiles enable row level security;
alter table public.coach_packages enable row level security;
alter table public.coach_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.wellness_checkins enable row level security;
alter table public.journal_entries enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.products enable row level security;
alter table public.subscriptions enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.operations_queue enable row level security;
alter table public.feature_flags enable row level security;
alter table public.data_requests enable row level security;
alter table public.audit_events enable row level security;

create policy "public profiles are readable" on public.profiles for select to anon, authenticated using (is_public or user_id = (select auth.uid()) or public.is_operator());
create policy "users update their profile" on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users read own consent" on public.consent_grants for select to authenticated using (owner_id = (select auth.uid()));
create policy "users manage own consent" on public.consent_grants for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "users manage own goals" on public.goals for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "catalog is readable" on public.exercise_catalog for select to anon, authenticated using (is_active);
create policy "programs are readable" on public.programs for select to anon, authenticated using (status = 'published' or public.is_operator());
create policy "program sessions are readable" on public.program_sessions for select to anon, authenticated using (exists (select 1 from public.programs p where p.id = program_id and p.status = 'published'));
create policy "program exercises are readable" on public.program_session_exercises for select to anon, authenticated using (exists (select 1 from public.program_sessions s join public.programs p on p.id = s.program_id where s.id = session_id and p.status = 'published'));

create policy "templates or own workouts are readable" on public.workouts for select to anon, authenticated using (is_template or owner_id = (select auth.uid()));
create policy "users create workouts" on public.workouts for insert to authenticated with check (owner_id = (select auth.uid()) and not is_template);
create policy "users update own workouts" on public.workouts for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and not is_template);
create policy "users delete own workouts" on public.workouts for delete to authenticated using (owner_id = (select auth.uid()));
create policy "template or owned workout exercises are readable" on public.workout_exercises for select to anon, authenticated using (exists (select 1 from public.workouts w where w.id = workout_id and (w.is_template or w.owner_id = (select auth.uid()))));
create policy "users manage owned workout exercises" on public.workout_exercises for all to authenticated using (exists (select 1 from public.workouts w where w.id = workout_id and w.owner_id = (select auth.uid()))) with check (exists (select 1 from public.workouts w where w.id = workout_id and w.owner_id = (select auth.uid())));
create policy "users manage own sets" on public.workout_sets for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "public communities are readable" on public.communities for select to anon, authenticated using (not is_private or exists (select 1 from public.community_members cm where cm.community_id = id and cm.user_id = (select auth.uid())));
create policy "members read memberships" on public.community_members for select to authenticated using (user_id = (select auth.uid()) or public.is_operator());
create policy "users join communities" on public.community_members for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users leave communities" on public.community_members for delete to authenticated using (user_id = (select auth.uid()));
create policy "published posts are readable" on public.posts for select to anon, authenticated using (status = 'published' or author_user_id = (select auth.uid()) or public.is_operator());
create policy "users create posts" on public.posts for insert to authenticated with check (author_user_id = (select auth.uid()) and author_profile_id = public.current_profile_id());
create policy "users update own posts" on public.posts for update to authenticated using (author_user_id = (select auth.uid())) with check (author_user_id = (select auth.uid()));
create policy "users delete own posts" on public.posts for delete to authenticated using (author_user_id = (select auth.uid()));
create policy "reactions are readable" on public.post_reactions for select to anon, authenticated using (true);
create policy "users manage own reactions" on public.post_reactions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "coaches are readable" on public.coach_profiles for select to anon, authenticated using (verified_at is not null);
create policy "coach packages are readable" on public.coach_packages for select to anon, authenticated using (is_active);
create policy "availability is readable" on public.coach_availability for select to anon, authenticated using (not is_booked and starts_at > now());
create policy "users manage own bookings" on public.bookings for all to authenticated using (member_id = (select auth.uid())) with check (member_id = (select auth.uid()));

create policy "users manage own checkins" on public.wellness_checkins for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "users manage own journal" on public.journal_entries for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "users manage own meals" on public.meals for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "users manage own meal items" on public.meal_items for all to authenticated using (exists (select 1 from public.meals m where m.id = meal_id and m.owner_id = (select auth.uid()))) with check (exists (select 1 from public.meals m where m.id = meal_id and m.owner_id = (select auth.uid())));

create policy "challenges are readable" on public.challenges for select to anon, authenticated using (status = 'published');
create policy "challenge progress is readable" on public.challenge_participants for select to anon, authenticated using (true);
create policy "users join challenges" on public.challenge_participants for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users update own challenge progress" on public.challenge_participants for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "users leave challenges" on public.challenge_participants for delete to authenticated using (user_id = (select auth.uid()));

create policy "accessible conversations are readable" on public.conversations for select to anon, authenticated using (is_demo or public.can_access_conversation(id));
create policy "memberships are readable by their owner" on public.conversation_members for select to authenticated using (user_id = (select auth.uid()));
create policy "accessible messages are readable" on public.messages for select to anon, authenticated using (public.can_access_conversation(conversation_id));
create policy "members send messages" on public.messages for insert to authenticated with check (sender_user_id = (select auth.uid()) and sender_profile_id = public.current_profile_id() and public.can_access_conversation(conversation_id));

create policy "products are readable" on public.products for select to anon, authenticated using (is_active);
create policy "users read own subscriptions" on public.subscriptions for select to authenticated using (owner_id = (select auth.uid()));
create policy "users read own wallet" on public.wallet_transactions for select to authenticated using (owner_id = (select auth.uid()));
create policy "users manage own notifications" on public.notifications for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "synthetic queue is readable" on public.operations_queue for select to anon, authenticated using (is_synthetic or public.is_operator());
create policy "operators manage queue" on public.operations_queue for all to authenticated using (public.is_operator()) with check (public.is_operator());
create policy "feature flags are readable" on public.feature_flags for select to anon, authenticated using (true);
create policy "users manage own data requests" on public.data_requests for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "operators read audit events" on public.audit_events for select to authenticated using (public.is_operator());

grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles, public.exercise_catalog, public.programs, public.program_sessions, public.program_session_exercises, public.workouts, public.workout_exercises, public.communities, public.posts, public.post_reactions, public.coach_profiles, public.coach_packages, public.coach_availability, public.challenges, public.challenge_participants, public.conversations, public.messages, public.products, public.operations_queue, public.feature_flags to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_operator() to anon, authenticated;
grant execute on function public.can_access_conversation(uuid) to anon, authenticated;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
