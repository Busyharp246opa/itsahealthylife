-- On the hosted HealthyLife project, retain the original Vite application's
-- schema before the imported application creates its own public objects.
-- Fresh local databases have no role_grants table, so this is a no-op there.
do $$
declare
  object record;
begin
  if to_regclass('public.role_grants') is null then
    return;
  end if;

  if to_regnamespace('healthy_legacy') is not null or to_regnamespace('healthy_legacy_private') is not null then
    raise exception 'HealthyLife legacy archive already exists; inspect before retrying';
  end if;

  create schema healthy_legacy;
  revoke all on schema healthy_legacy from public, anon, authenticated;
  drop trigger if exists on_auth_user_created on auth.users;

  for object in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and c.relname <> 'spatial_ref_sys'
    order by c.relname
  loop
    execute format('alter table public.%I set schema healthy_legacy', object.relname);
  end loop;

  for object in
    select p.proname, pg_get_function_identity_arguments(p.oid) as arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
    order by p.proname
  loop
    execute format('alter function public.%I(%s) set schema healthy_legacy', object.proname, object.arguments);
  end loop;

  if to_regnamespace('private') is not null then
    alter schema private rename to healthy_legacy_private;
    revoke all on schema healthy_legacy_private from public, anon, authenticated;
  end if;
end;
$$;
