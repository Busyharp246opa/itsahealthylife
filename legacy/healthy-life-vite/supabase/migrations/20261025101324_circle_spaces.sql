-- Topic rooms and separate member/expert Circle spaces.
create table public.circle_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 80),
  topic text not null,
  description text not null default '',
  accent text not null default 'lavender' check (accent in ('lavender','lime','orange')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.circle_guidelines (
  id text primary key default 'main' check (id = 'main'),
  body text not null check (char_length(body) between 10 and 4000),
  updated_at timestamptz not null default now()
);
insert into public.circle_guidelines(id,body) values ('main','Be kind and respect privacy. Share your own experience, avoid personal medical advice, and report content that needs review.');
insert into public.circle_rooms(slug,name,topic,description,accent) values
 ('strength-and-movement','Strength & movement','Movement','Build consistency and share practical training wins.','lime'),
 ('food-and-energy','Food & energy','Food','Everyday meals, ideas, and sustainable habits.','orange'),
 ('mind-and-recovery','Mind & recovery','Mental wellbeing','Rest, reflection, and a steadier routine.','lavender');
alter table public.community_posts
  add column circle_space text not null default 'member' check (circle_space in ('member','expert')),
  add column room_id uuid references public.circle_rooms(id) on delete set null,
  add column kind text not null default 'update' check (kind in ('update','question','milestone','coach_tip')),
  add column status text not null default 'published' check (status in ('published','hidden'));
create index community_posts_space_created_idx on public.community_posts(circle_space,status,created_at desc);
create index community_posts_room_created_idx on public.community_posts(room_id,created_at desc);
create table public.community_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create index community_reactions_user_idx on public.community_reactions(user_id);
create table public.community_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check (blocker_id <> blocked_id)
);
create index community_blocks_blocked_idx on public.community_blocks(blocked_id);

create function private.circle_space_allowed(space text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select case when space = 'expert' then private.is_approved_expert((select auth.uid()))
    when space = 'member' then (select auth.uid()) is not null and not private.is_approved_expert((select auth.uid()))
    else false end;
$$;
revoke all on function private.circle_space_allowed(text) from public;
grant execute on function private.circle_space_allowed(text) to authenticated;

create function private.validate_circle_post()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.circle_space = 'expert' and new.room_id is not null then raise exception 'Expert posts cannot join member rooms'; end if;
  if new.room_id is not null and not exists(select 1 from public.circle_rooms where id=new.room_id and active) then raise exception 'Circle room is not available'; end if;
  if char_length(btrim(new.title)) not between 1 and 120 or char_length(btrim(new.body)) not between 1 and 5000 then raise exception 'Invalid post length'; end if;
  if tg_op = 'UPDATE' and not private.has_role('admin') then
    if new.author_id <> old.author_id or new.circle_space <> old.circle_space or new.status <> old.status then raise exception 'Protected Circle fields cannot be changed'; end if;
  end if;
  return new;
end;
$$;
create trigger validate_circle_post before insert or update on public.community_posts for each row execute function private.validate_circle_post();
alter table public.community_comments add constraint circle_comment_length check (char_length(btrim(body)) between 1 and 2000);

alter table public.circle_rooms enable row level security;
alter table public.circle_guidelines enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_blocks enable row level security;
revoke all on public.circle_rooms,public.circle_guidelines,public.community_reactions,public.community_blocks from anon,authenticated;
grant select on public.circle_rooms,public.circle_guidelines to authenticated;
grant select,insert,delete on public.community_reactions,public.community_blocks to authenticated;
grant insert,update,delete on public.circle_rooms,public.circle_guidelines to authenticated;
create policy circle_rooms_read on public.circle_rooms for select to authenticated using(active or private.has_role('admin'));
create policy circle_rooms_admin on public.circle_rooms for all to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy circle_guidelines_read on public.circle_guidelines for select to authenticated using(true);
create policy circle_guidelines_admin on public.circle_guidelines for all to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy circle_blocks_select on public.community_blocks for select to authenticated using(blocker_id=(select auth.uid()));
create policy circle_blocks_insert on public.community_blocks for insert to authenticated with check(blocker_id=(select auth.uid()));
create policy circle_blocks_delete on public.community_blocks for delete to authenticated using(blocker_id=(select auth.uid()));

drop policy posts_read on public.community_posts;
drop policy posts_insert on public.community_posts;
drop policy posts_update on public.community_posts;
create policy posts_read on public.community_posts for select to authenticated using(
  private.has_role('admin') or
  (status='published' and private.circle_space_allowed(circle_space)
   and not exists(select 1 from public.community_blocks b where b.blocker_id=(select auth.uid()) and b.blocked_id=author_id))
);
create policy posts_insert on public.community_posts for insert to authenticated with check(
  author_id=(select auth.uid()) and private.circle_space_allowed(circle_space) and status='published'
);
create policy posts_update on public.community_posts for update to authenticated
  using(author_id=(select auth.uid()) or private.has_role('admin'))
  with check(author_id=(select auth.uid()) or private.has_role('admin'));

drop policy comments_read on public.community_comments;
drop policy comments_insert on public.community_comments;
create policy comments_read on public.community_comments for select to authenticated using(
  exists(select 1 from public.community_posts p where p.id=post_id)
);
create policy comments_insert on public.community_comments for insert to authenticated with check(
  author_id=(select auth.uid()) and exists(select 1 from public.community_posts p where p.id=post_id and p.status='published' and private.circle_space_allowed(p.circle_space))
);
create policy circle_reactions_read on public.community_reactions for select to authenticated using(
  exists(select 1 from public.community_posts p where p.id=post_id)
);
create policy circle_reactions_insert on public.community_reactions for insert to authenticated with check(
  user_id=(select auth.uid()) and exists(select 1 from public.community_posts p where p.id=post_id and p.status='published' and private.circle_space_allowed(p.circle_space))
);
create policy circle_reactions_delete on public.community_reactions for delete to authenticated using(user_id=(select auth.uid()));
drop policy reports_insert on public.community_reports;
create policy reports_insert on public.community_reports for insert to authenticated with check(
  reporter_id=(select auth.uid()) and exists(select 1 from public.community_posts p where p.id=post_id and p.status='published' and p.author_id <> (select auth.uid()))
);
