create table public.badges (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 3 and 80),
  description text not null check (char_length(description) between 10 and 1000),
  tier text not null check (tier in ('bronze', 'silver', 'gold')),
  image_path text not null default '/brand/healthy-life-mark.png' check (image_path = '/brand/healthy-life-mark.png'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.badge_awards (
  badge_id uuid not null references public.badges(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  awarded_by uuid references auth.users(id) on delete set null,
  note text not null default '' check (char_length(note) <= 500),
  awarded_at timestamptz not null default now(),
  primary key (badge_id, recipient_user_id)
);
create index badge_awards_recipient_idx on public.badge_awards(recipient_user_id, awarded_at desc);

create table public.coach_spotlights (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coach_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index coach_spotlights_window_idx on public.coach_spotlights(starts_on, ends_on);

create table public.referral_codes (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^FC[A-Z0-9]{10}$'),
  created_at timestamptz not null default now()
);
create table public.referral_attributions (
  referred_user_id uuid primary key references auth.users(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  code text not null references public.referral_codes(code),
  created_at timestamptz not null default now(),
  check (referred_user_id <> referrer_user_id)
);
create index referral_attributions_referrer_idx on public.referral_attributions(referrer_user_id, created_at desc);

alter table public.badges enable row level security;
alter table public.badge_awards enable row level security;
alter table public.coach_spotlights enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;
revoke all on public.badges, public.badge_awards, public.coach_spotlights,
  public.referral_codes, public.referral_attributions from anon, authenticated;
grant select on public.badges, public.coach_spotlights to anon, authenticated;
grant select on public.badge_awards, public.referral_codes, public.referral_attributions to authenticated;
grant all on public.badges, public.badge_awards, public.coach_spotlights,
  public.referral_codes, public.referral_attributions to service_role;

create policy "active badges are visible" on public.badges for select to anon, authenticated using (is_active);
create policy "owner reads awards" on public.badge_awards for select to authenticated
  using (recipient_user_id = (select auth.uid()));
create policy "current verified spotlights are visible" on public.coach_spotlights for select to anon, authenticated
  using (is_active and starts_on <= current_date and ends_on >= current_date and exists (
    select 1 from public.coach_profiles c where c.id = coach_id and c.verified_at is not null
  ));
create policy "owner reads referral code" on public.referral_codes for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "referred member reads attribution" on public.referral_attributions for select to authenticated
  using (referred_user_id = (select auth.uid()));
