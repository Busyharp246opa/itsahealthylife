-- Healthy Life foundation. Run only against the dedicated jqtrzwiyeohcljdvfkss project.
-- Browser clients receive a publishable key; no service key belongs in this repository.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'UTC',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.role_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('member','expert','admin')),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id,role)
);
create or replace function private.has_role(requested_role text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.role_grants where user_id = (select auth.uid()) and role = requested_role
  );
$$;
revoke all on function private.has_role(text) from public;
grant execute on function private.has_role(text) to authenticated;
create or replace function private.create_member_profile()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles(id,display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name',''));
  insert into public.role_grants(user_id,role) values (new.id,'member');
  return new;
end;
$$;
revoke all on function private.create_member_profile() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_member_profile();

create table public.member_health (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  goal text, height_cm numeric(5,1), weight_kg numeric(5,1), dietary_preferences text,
  consent_version text, consented_at timestamptz, share_with_expert boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.expert_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  specialty text not null default '', bio text not null default '', credentials text not null default '',
  formats text[] not null default array['Virtual']::text[], session_price numeric(10,2) not null default 0 check (session_price >= 0),
  currency text not null default 'USD', rating numeric(2,1) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.expert_reviews (
  id uuid primary key default gen_random_uuid(), expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  status text not null check (status in ('submitted','needs_changes','approved','rejected','suspended')),
  reviewer_id uuid references public.profiles(id), note text not null default '', created_at timestamptz not null default now()
);
create index expert_reviews_latest on public.expert_reviews(expert_id,created_at desc);
create or replace function private.is_approved_expert(requested_expert uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.expert_reviews r where r.expert_id = requested_expert
      and r.id = (select r2.id from public.expert_reviews r2 where r2.expert_id = requested_expert order by r2.created_at desc, r2.id desc limit 1)
      and r.status = 'approved'
  );
$$;
revoke all on function private.is_approved_expert(uuid) from public;
grant execute on function private.is_approved_expert(uuid) to authenticated;
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(), expert_id uuid not null references public.expert_profiles(user_id) on delete cascade,
  starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null,
  created_at timestamptz not null default now(), check (ends_at > starts_at), unique(expert_id,starts_at)
);
create table public.policy_versions (
  version integer generated always as identity primary key,
  free_cancellation_hours integer not null check (free_cancellation_hours >= 0),
  late_fee_percent numeric(5,2) not null check (late_fee_percent between 0 and 100),
  commission_percent numeric(5,2) not null check (commission_percent between 0 and 100),
  published_by uuid references public.profiles(id), published_at timestamptz not null default now()
);
insert into public.policy_versions(free_cancellation_hours,late_fee_percent,commission_percent) values (24,20,15);
create table public.bookings (
  id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id),
  expert_id uuid not null references public.expert_profiles(user_id), slot_id uuid not null references public.availability_slots(id),
  service_format text not null check (service_format in ('Virtual','In person')),
  status text not null check (status in ('confirmed','completed','cancelled','disputed')),
  price numeric(10,2) not null check (price >= 0), currency text not null,
  policy_version integer not null references public.policy_versions(version),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_booking_per_slot on public.bookings(slot_id) where status in ('confirmed','completed','disputed');
create index bookings_member_start on public.bookings(member_id,created_at desc);
create index bookings_expert_start on public.bookings(expert_id,created_at desc);
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
  status text not null check (status in ('requires_action','authorized','captured','settled','partially_refunded','refunded')),
  amount numeric(10,2) not null check (amount >= 0), currency text not null,
  provider text not null default 'simulation', provider_reference text unique,
  created_at timestamptz not null default now()
);
create table public.payouts (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id),
  expert_id uuid not null references public.expert_profiles(user_id),
  status text not null check (status in ('pending','held','eligible','transferred','failed')),
  amount numeric(10,2) not null check (amount >= 0), provider_reference text,
  created_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id), body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_conversation_time on public.messages(conversation_id,created_at);

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null, meal_slot text not null, name text not null,
  calories numeric(8,1) not null check (calories >= 0), protein_g numeric(8,1) not null default 0 check(protein_g >= 0),
  carbs_g numeric(8,1) not null default 0 check(carbs_g >= 0), fat_g numeric(8,1) not null default 0 check(fat_g >= 0),
  created_at timestamptz not null default now()
);
create index meal_entries_member_date on public.meal_entries(member_id,log_date desc);
create table public.activity_entries (
  id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null, name text not null, minutes integer not null check (minutes > 0), created_at timestamptz not null default now()
);
create table public.content_items (
  id uuid primary key default gen_random_uuid(), author_id uuid references public.profiles(id),
  kind text not null check (kind in ('recipe','workout','meal plan','article')),
  title text not null, body text not null default '', category text not null default 'General',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(), published_at timestamptz
);
create table public.saved_content (
  member_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(member_id,content_id)
);
create table public.challenges (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  goal text not null, active boolean not null default false, created_at timestamptz not null default now()
);
create table public.challenge_steps (
  id uuid primary key default gen_random_uuid(), challenge_id uuid not null references public.challenges(id) on delete cascade,
  ordinal integer not null check (ordinal > 0), title text not null, unique(challenge_id,ordinal)
);
create table public.challenge_progress (
  member_id uuid not null references public.profiles(id) on delete cascade,
  step_id uuid not null references public.challenge_steps(id) on delete cascade,
  completed_at timestamptz not null default now(), primary key(member_id,step_id)
);
create table public.community_posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id),
  category text not null, title text not null, body text not null, created_at timestamptz not null default now()
);
create table public.community_comments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id), body text not null, created_at timestamptz not null default now()
);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id), reason text not null,
  status text not null default 'open' check (status in ('open','dismissed','actioned')),
  created_at timestamptz not null default now(), unique(post_id,reporter_id)
);
create table public.products (
  id uuid primary key default gen_random_uuid(), name text not null, description text not null default '',
  price numeric(10,2) not null check (price >= 0), currency text not null default 'USD',
  stock integer not null default 0 check (stock >= 0), active boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id),
  status text not null check (status in ('placed','shipped','delivered','cancelled','refunded')),
  total numeric(10,2) not null check (total >= 0), currency text not null,
  created_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id), quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), member_id uuid not null references public.profiles(id),
  category text not null, subject text not null, detail text not null,
  status text not null default 'open' check(status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
  action text not null, subject_type text not null, subject_id uuid,
  detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

-- RLS and grants are explicit because newer projects need not expose SQL-created tables automatically.
do $$ declare t text; begin
  foreach t in array array['profiles','role_grants','member_health','expert_profiles','expert_reviews','availability_slots','policy_versions','bookings','payment_transactions','payouts','conversations','messages','meal_entries','activity_entries','content_items','saved_content','challenges','challenge_steps','challenge_progress','community_posts','community_comments','community_reports','products','orders','order_items','support_tickets','audit_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
  end loop;
end $$;
grant usage on schema public to authenticated;
grant select, update(display_name,timezone,locale) on public.profiles to authenticated;
grant select on public.role_grants to authenticated;
grant select, insert, update, delete on public.member_health,public.meal_entries,public.activity_entries,public.saved_content,public.challenge_progress,public.community_posts,public.community_comments,public.community_reports,public.support_tickets to authenticated;
grant select on public.expert_profiles,public.availability_slots to authenticated;
grant insert(user_id,specialty,bio,credentials,formats,session_price,currency) on public.expert_profiles to authenticated;
grant update(specialty,bio,credentials,formats,session_price,currency) on public.expert_profiles to authenticated;
grant insert(expert_id,starts_at,ends_at,timezone), delete on public.availability_slots to authenticated;
grant select on public.expert_reviews,public.bookings,public.payment_transactions,public.payouts,public.conversations,public.messages,public.policy_versions,public.content_items,public.challenges,public.challenge_steps,public.products,public.orders,public.order_items,public.audit_events to authenticated;
grant insert on public.messages to authenticated;
grant insert(author_id,kind,title,body,category) on public.content_items to authenticated;
grant all on public.expert_reviews,public.bookings,public.payment_transactions,public.payouts,public.conversations,public.policy_versions,public.challenges,public.challenge_steps,public.products,public.orders,public.order_items,public.audit_events to service_role;

create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()) or private.has_role('admin'));
create policy profiles_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy roles_read on public.role_grants for select to authenticated using(user_id=(select auth.uid()) or private.has_role('admin'));
create policy health_read on public.member_health for select to authenticated using(user_id=(select auth.uid()) or (share_with_expert and exists(select 1 from public.bookings b where b.member_id=user_id and b.expert_id=(select auth.uid()) and b.status in ('confirmed','completed'))));
create policy health_insert on public.member_health for insert to authenticated with check(user_id=(select auth.uid()));
create policy health_update on public.member_health for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy health_delete on public.member_health for delete to authenticated using(user_id=(select auth.uid()));
create policy expert_read on public.expert_profiles for select to authenticated using(user_id=(select auth.uid()) or private.has_role('admin') or private.is_approved_expert(user_id));
create policy expert_insert on public.expert_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy expert_update on public.expert_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reviews_read on public.expert_reviews for select to authenticated using(expert_id=(select auth.uid()) or private.has_role('admin'));
create policy slots_read on public.availability_slots for select to authenticated using(expert_id=(select auth.uid()) or private.has_role('admin') or private.is_approved_expert(expert_id));
create policy slots_insert on public.availability_slots for insert to authenticated with check(expert_id=(select auth.uid()));
create policy slots_delete on public.availability_slots for delete to authenticated using(expert_id=(select auth.uid()) and not exists(select 1 from public.bookings b where b.slot_id=availability_slots.id and b.status in ('confirmed','completed','disputed')));
create policy policies_read on public.policy_versions for select to authenticated using(true);
create policy bookings_read on public.bookings for select to authenticated using(member_id=(select auth.uid()) or expert_id=(select auth.uid()) or private.has_role('admin'));
create policy payments_read on public.payment_transactions for select to authenticated using(private.has_role('admin') or exists(select 1 from public.bookings b where b.id=booking_id and (b.member_id=(select auth.uid()) or b.expert_id=(select auth.uid()))));
create policy payouts_read on public.payouts for select to authenticated using(expert_id=(select auth.uid()) or private.has_role('admin'));
create policy conversations_read on public.conversations for select to authenticated using(exists(select 1 from public.bookings b where b.id=booking_id and b.status='confirmed' and (b.member_id=(select auth.uid()) or b.expert_id=(select auth.uid()))));
create policy messages_read on public.messages for select to authenticated using(exists(select 1 from public.conversations c join public.bookings b on b.id=c.booking_id where c.id=conversation_id and b.status='confirmed' and (b.member_id=(select auth.uid()) or b.expert_id=(select auth.uid()))));
create policy messages_insert on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.conversations c join public.bookings b on b.id=c.booking_id where c.id=conversation_id and b.status='confirmed' and (b.member_id=(select auth.uid()) or b.expert_id=(select auth.uid()))));
create policy meals_all on public.meal_entries for all to authenticated using(member_id=(select auth.uid())) with check(member_id=(select auth.uid()));
create policy activities_all on public.activity_entries for all to authenticated using(member_id=(select auth.uid())) with check(member_id=(select auth.uid()));
create policy content_read on public.content_items for select to authenticated using(status='published' or author_id=(select auth.uid()) or private.has_role('admin'));
create policy content_insert on public.content_items for insert to authenticated with check(author_id=(select auth.uid()) and status='draft');
create policy saved_all on public.saved_content for all to authenticated using(member_id=(select auth.uid())) with check(member_id=(select auth.uid()));
create policy challenges_read on public.challenges for select to authenticated using(active or private.has_role('admin'));
create policy steps_read on public.challenge_steps for select to authenticated using(exists(select 1 from public.challenges c where c.id=challenge_id and (c.active or private.has_role('admin'))));
create policy progress_all on public.challenge_progress for all to authenticated using(member_id=(select auth.uid())) with check(member_id=(select auth.uid()));
create policy posts_read on public.community_posts for select to authenticated using(true);
create policy posts_insert on public.community_posts for insert to authenticated with check(author_id=(select auth.uid()));
create policy posts_update on public.community_posts for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create policy posts_delete on public.community_posts for delete to authenticated using(author_id=(select auth.uid()) or private.has_role('admin'));
create policy comments_read on public.community_comments for select to authenticated using(true);
create policy comments_insert on public.community_comments for insert to authenticated with check(author_id=(select auth.uid()));
create policy comments_delete on public.community_comments for delete to authenticated using(author_id=(select auth.uid()) or private.has_role('admin'));
create policy reports_read on public.community_reports for select to authenticated using(reporter_id=(select auth.uid()) or private.has_role('admin'));
create policy reports_insert on public.community_reports for insert to authenticated with check(reporter_id=(select auth.uid()));
create policy products_read on public.products for select to authenticated using(active or private.has_role('admin'));
create policy orders_read on public.orders for select to authenticated using(member_id=(select auth.uid()) or private.has_role('admin'));
create policy items_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.member_id=(select auth.uid()) or private.has_role('admin'))));
create policy tickets_read on public.support_tickets for select to authenticated using(member_id=(select auth.uid()) or private.has_role('admin'));
create policy tickets_insert on public.support_tickets for insert to authenticated with check(member_id=(select auth.uid()) and status='open');
create policy audit_read on public.audit_events for select to authenticated using(private.has_role('admin'));

-- Writes to booking/payment/payout/order/policy/review records must come from a trusted
-- server workflow that validates provider events and records audit entries. No client
-- role receives direct write grants for these state machines.
