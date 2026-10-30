create table public.member_profile_details (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  phone text not null default '' check (char_length(phone) <= 25),
  country text not null default '' check (char_length(country) <= 80),
  city text not null default '' check (char_length(city) <= 80),
  updated_at timestamptz not null default now()
);
create table public.discovery_tags (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('interest', 'prompt')),
  label text not null check (char_length(label) between 2 and 80),
  priority integer not null default 0 check (priority between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index discovery_tags_kind_label_idx on public.discovery_tags(kind, lower(label));
create table public.member_discovery_choices (
  owner_id uuid not null references auth.users(id) on delete cascade,
  tag_id uuid not null references public.discovery_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, tag_id)
);

create trigger member_profile_details_touch before update on public.member_profile_details for each row execute function public.touch_updated_at();
create trigger discovery_tags_touch before update on public.discovery_tags for each row execute function public.touch_updated_at();
alter table public.member_profile_details enable row level security;
alter table public.discovery_tags enable row level security;
alter table public.member_discovery_choices enable row level security;
revoke all on public.member_profile_details, public.discovery_tags, public.member_discovery_choices from anon, authenticated;
grant select, insert, update on public.member_profile_details to authenticated;
grant select on public.discovery_tags to anon, authenticated;
grant select, insert, delete on public.member_discovery_choices to authenticated;
grant all on public.member_profile_details, public.discovery_tags, public.member_discovery_choices to service_role;

create policy "owner reads basic details" on public.member_profile_details for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "registered owner creates basic details" on public.member_profile_details for insert to authenticated
  with check (owner_id = (select auth.uid()) and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);
create policy "registered owner updates basic details" on public.member_profile_details for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);
create policy "active discovery tags are visible" on public.discovery_tags for select to anon, authenticated
  using (is_active);
create policy "owner reads discovery choices" on public.member_discovery_choices for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "registered owner chooses discovery tags" on public.member_discovery_choices for insert to authenticated
  with check (owner_id = (select auth.uid()) and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false and exists (
    select 1 from public.discovery_tags t where t.id = tag_id and t.is_active
  ));
create policy "owner removes discovery choices" on public.member_discovery_choices for delete to authenticated
  using (owner_id = (select auth.uid()));
