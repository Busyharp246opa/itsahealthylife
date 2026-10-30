create table public.notification_campaigns (
  id uuid primary key,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  body text not null check (char_length(body) between 4 and 2000),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  created_at timestamptz not null default now()
);
alter table public.notification_campaigns enable row level security;
revoke all on public.notification_campaigns from anon, authenticated;

alter table public.notifications add column campaign_id uuid references public.notification_campaigns(id) on delete set null;
create unique index notifications_campaign_owner_idx on public.notifications(campaign_id, owner_id);
revoke all on public.notifications from anon, authenticated;
grant select, update(read_at) on public.notifications to authenticated;
