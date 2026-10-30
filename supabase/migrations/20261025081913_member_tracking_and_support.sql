-- Member support and community safety.
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 120),
  body text not null check (char_length(body) between 4 and 4000),
  category text not null check (category in ('account', 'community', 'training', 'other')),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 4 and 4000),
  created_at timestamptz not null default now()
);
create index support_messages_ticket_idx on public.support_messages(ticket_id, created_at);

create table public.community_guidelines (
  id text primary key check (id = 'main'),
  body text not null check (char_length(body) between 20 and 10000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.community_guidelines(id, body) values
  ('main', 'Treat people with respect. Share training experiences without medical claims or personal attacks. Report content that puts someone at risk.');

create table public.user_blocks (
  owner_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, blocked_user_id),
  check (owner_id <> blocked_user_id)
);
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  reason text not null check (reason in ('harassment', 'spam', 'unsafe', 'other')),
  detail text not null default '' check (char_length(detail) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, post_id)
);

create trigger support_tickets_touch before update on public.support_tickets for each row execute function public.touch_updated_at();
create trigger guidelines_touch before update on public.community_guidelines for each row execute function public.touch_updated_at();

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.community_guidelines enable row level security;
alter table public.user_blocks enable row level security;
alter table public.post_reports enable row level security;

revoke all on public.support_tickets,
  public.support_messages, public.community_guidelines, public.user_blocks, public.post_reports
  from anon, authenticated;
grant select, insert, update, delete on public.user_blocks to authenticated;
grant select, insert on public.support_tickets, public.support_messages, public.post_reports to authenticated;
grant select on public.community_guidelines to anon, authenticated;

create policy "owner reads support tickets" on public.support_tickets for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "owner creates support tickets" on public.support_tickets for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'open');
create policy "owner reads support messages" on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.owner_id = (select auth.uid())));
create policy "owner writes support messages" on public.support_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (
    select 1 from public.support_tickets t where t.id = ticket_id and t.owner_id = (select auth.uid()) and t.status <> 'resolved'
  ));
create policy "guidelines are readable" on public.community_guidelines for select to anon, authenticated using (true);
create policy "owner manages blocks" on public.user_blocks for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "reporter reads reports" on public.post_reports for select to authenticated
  using (reporter_id = (select auth.uid()));
create policy "reporter submits report" on public.post_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- Published content respects its audience and the viewer's own block list.
drop policy "published posts are readable" on public.posts;
create policy "posts respect audience and blocks" on public.posts for select to anon, authenticated
  using (
    author_user_id = (select auth.uid()) or public.is_operator() or
    (status = 'published' and
      (audience = 'public' or (audience = 'community' and exists (
        select 1 from public.communities c where c.id = community_id and
          (not c.is_private or exists (select 1 from public.community_members cm where cm.community_id = c.id and cm.user_id = (select auth.uid())))
      ))) and not exists (
        select 1 from public.user_blocks b where b.owner_id = (select auth.uid()) and b.blocked_user_id = author_user_id
      ))
  );
