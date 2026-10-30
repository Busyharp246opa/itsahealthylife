-- Live Face Offs are public member events. Existing invitation-only matches
-- remain unchanged unless a live event is attached to them.
alter table public.faceoff_matches add column live_enabled boolean not null default false;

drop policy "circle members find open or own faceoffs" on public.faceoff_matches;
create policy "circle members find open public live or own faceoffs" on public.faceoff_matches
for select to authenticated using (
  circle_space = private.current_circle_space() and
  (status = 'open' or creator_user_id = (select auth.uid()) or
   invitee_user_id = (select auth.uid()) or opponent_user_id = (select auth.uid()) or
   (circle_space = 'trainee' and live_enabled and status = 'active'))
);

create table public.faceoff_live_events (
  match_id uuid primary key references public.faceoff_matches(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 5 and 60),
  rules text not null check (char_length(rules) between 12 and 1200),
  reward_title text not null check (char_length(reward_title) between 3 and 80),
  state text not null default 'scheduled' check (state in ('scheduled', 'live', 'voting', 'completed', 'void')),
  stage_arn text,
  creator_ready_at timestamptz,
  opponent_ready_at timestamptz,
  live_started_at timestamptz,
  live_ended_at timestamptz,
  voting_closes_at timestamptz,
  winner_user_id uuid references auth.users(id) on delete set null,
  result text check (result in ('creator', 'opponent', 'tie')),
  created_at timestamptz not null default now(),
  check (starts_at > created_at - interval '1 day' and starts_at < created_at + interval '367 days'),
  check ((state = 'scheduled' and stage_arn is null and live_started_at is null) or
         (state = 'live' and stage_arn is not null and live_started_at is not null) or
         (state in ('voting', 'completed') and live_ended_at is not null and voting_closes_at is not null) or
         state = 'void')
);
create index faceoff_live_events_upcoming_idx on public.faceoff_live_events (starts_at) where state = 'scheduled';
create index faceoff_live_events_voting_idx on public.faceoff_live_events (voting_closes_at) where state = 'voting';
alter table public.faceoff_live_events enable row level security;
grant select on public.faceoff_live_events to authenticated;
create policy "members see visible live faceoffs" on public.faceoff_live_events
for select to authenticated using (
  private.current_circle_space() = 'trainee' and exists (
    select 1 from public.faceoff_matches m where m.id = match_id and m.circle_space = 'trainee'
  )
);

create or replace function private.void_cancelled_faceoff_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.live_enabled and new.status in ('declined', 'cancelled') and old.status is distinct from new.status then
    update public.faceoff_live_events set state = 'void'
      where match_id = new.id and state = 'scheduled';
  end if;
  return new;
end;
$$;
revoke all on function private.void_cancelled_faceoff_event() from public, anon, authenticated;
create trigger void_cancelled_faceoff_event after update of status on public.faceoff_matches
for each row execute function private.void_cancelled_faceoff_event();

create table public.faceoff_votes (
  match_id uuid not null references public.faceoff_live_events(match_id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (match_id, voter_user_id)
);
create index faceoff_votes_candidate_idx on public.faceoff_votes (match_id, candidate_user_id);
alter table public.faceoff_votes enable row level security;
-- Votes are written only by the server-side, service-role RPC below.

create table public.faceoff_vote_tallies (
  match_id uuid primary key references public.faceoff_live_events(match_id) on delete cascade,
  creator_votes integer not null default 0 check (creator_votes >= 0),
  opponent_votes integer not null default 0 check (opponent_votes >= 0),
  updated_at timestamptz not null default now()
);
alter table public.faceoff_vote_tallies enable row level security;
grant select on public.faceoff_vote_tallies to authenticated;
create policy "members see visible faceoff tallies" on public.faceoff_vote_tallies
for select to authenticated using (
  private.current_circle_space() = 'trainee' and exists (
    select 1 from public.faceoff_matches m where m.id = match_id and m.circle_space = 'trainee'
  )
);

create or replace function private.init_faceoff_tally()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.faceoff_vote_tallies (match_id) values (new.match_id);
  return new;
end;
$$;
create trigger init_faceoff_tally after insert on public.faceoff_live_events
for each row execute function private.init_faceoff_tally();

create table public.faceoff_awards (
  match_id uuid primary key references public.faceoff_live_events(match_id) on delete cascade,
  winner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  awarded_at timestamptz not null default now()
);
alter table public.faceoff_awards enable row level security;
grant select on public.faceoff_awards to authenticated;
create policy "members see visible faceoff awards" on public.faceoff_awards
for select to authenticated using (
  private.current_circle_space() = 'trainee' and exists (
    select 1 from public.faceoff_matches m where m.id = match_id and m.circle_space = 'trainee'
  )
);

create or replace function public.record_faceoff_vote(p_match_id uuid, p_candidate uuid, p_voter uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  event_row public.faceoff_live_events%rowtype;
  match_row public.faceoff_matches%rowtype;
begin
  select * into event_row from public.faceoff_live_events where match_id = p_match_id for update;
  if not found or event_row.state <> 'voting' or event_row.voting_closes_at <= clock_timestamp() then
    raise exception 'Voting is closed';
  end if;
  select * into match_row from public.faceoff_matches where id = p_match_id;
  if match_row.circle_space <> 'trainee' or match_row.status <> 'active' or
     match_row.opponent_user_id is null or
     p_candidate not in (match_row.creator_user_id, match_row.opponent_user_id) or
     p_voter in (match_row.creator_user_id, match_row.opponent_user_id) or
     not exists (select 1 from public.profiles where user_id = p_voter and role = 'member') then
    raise exception 'Vote is not eligible';
  end if;
  insert into public.faceoff_votes (match_id, voter_user_id, candidate_user_id)
    values (p_match_id, p_voter, p_candidate);
  update public.faceoff_vote_tallies set
    creator_votes = creator_votes + case when p_candidate = match_row.creator_user_id then 1 else 0 end,
    opponent_votes = opponent_votes + case when p_candidate = match_row.opponent_user_id then 1 else 0 end,
    updated_at = now()
  where match_id = p_match_id;
end;
$$;
revoke all on function public.record_faceoff_vote(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_faceoff_vote(uuid, uuid, uuid) to service_role;

create or replace function public.finalize_faceoff(p_match_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  event_row public.faceoff_live_events%rowtype;
  match_row public.faceoff_matches%rowtype;
  tally_row public.faceoff_vote_tallies%rowtype;
  winning_user uuid;
  outcome text;
begin
  select * into event_row from public.faceoff_live_events where match_id = p_match_id for update;
  if not found then raise exception 'Face Off not found'; end if;
  if event_row.state = 'completed' then return event_row.result; end if;
  if event_row.state <> 'voting' or event_row.voting_closes_at > clock_timestamp() then
    raise exception 'Voting is still open';
  end if;
  select * into match_row from public.faceoff_matches where id = p_match_id;
  select * into tally_row from public.faceoff_vote_tallies where match_id = p_match_id;
  if tally_row.creator_votes = tally_row.opponent_votes then
    outcome := 'tie';
  elsif tally_row.creator_votes > tally_row.opponent_votes then
    outcome := 'creator'; winning_user := match_row.creator_user_id;
  else
    outcome := 'opponent'; winning_user := match_row.opponent_user_id;
  end if;
  update public.faceoff_live_events set state = 'completed', result = outcome,
    winner_user_id = winning_user where match_id = p_match_id;
  if winning_user is not null then
    insert into public.faceoff_awards (match_id, winner_user_id, title)
      values (p_match_id, winning_user, event_row.reward_title)
      on conflict (match_id) do nothing;
  end if;
  return outcome;
end;
$$;
revoke all on function public.finalize_faceoff(uuid) from public, anon, authenticated;
grant execute on function public.finalize_faceoff(uuid) to service_role;

grant select, insert, update, delete on public.faceoff_live_events to service_role;
grant select, insert, update, delete on public.faceoff_votes to service_role;
grant select, insert, update, delete on public.faceoff_vote_tallies to service_role;
grant select, insert, update, delete on public.faceoff_awards to service_role;
grant select, update, delete on public.faceoff_matches to service_role;

alter publication supabase_realtime add table public.faceoff_live_events, public.faceoff_vote_tallies;
