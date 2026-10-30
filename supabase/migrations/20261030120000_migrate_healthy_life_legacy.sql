-- The original hosted application is archived in healthy_legacy. Preserve
-- auth.users IDs and copy compatible records into the new public schema.
do $$
declare
  legacy_program record;
  day_entry record;
  movement record;
  target_day uuid;
  custom_id uuid;
  movement_position integer;
  prior_sub text := current_setting('request.jwt.claim.sub', true);
begin
  if to_regclass('healthy_legacy.role_grants') is null then
    return;
  end if;

  insert into public.profiles
    (id, user_id, handle, display_name, initials, role, is_public, created_at, updated_at)
  select u.id, u.id,
    'member_' || substr(replace(u.id::text, '-', ''), 1, 10),
    left(coalesce(nullif(trim(p.display_name), ''), nullif(u.raw_user_meta_data ->> 'display_name', ''), 'Healthy Life member'), 80),
    left(coalesce(nullif(regexp_replace(coalesce(p.display_name, 'HL'), '[^[:alpha:]]', '', 'g'), ''), 'HL'), 2),
    case when exists (select 1 from healthy_legacy.role_grants r where r.user_id = u.id and r.role = 'admin')
      then 'super_admin'::public.profile_role else 'member'::public.profile_role end,
    false, coalesce(p.created_at, now()), coalesce(p.updated_at, now())
  from auth.users u
  left join healthy_legacy.profiles p on p.id = u.id
  where not exists (select 1 from public.profiles existing where existing.user_id = u.id);

  insert into public.communities (id, slug, name, description, topic, accent, created_at)
  select id, slug, name, description, topic, 'plum', created_at
  from healthy_legacy.circle_rooms where active
  on conflict (slug) do nothing;

  insert into public.products
    (id, slug, name, description, product_type, price, currency, accent, is_active)
  select id, 'healthy-' || substr(replace(id::text, '-', ''), 1, 16), name, description,
    'merch', round(price)::integer, currency, 'plum', active
  from healthy_legacy.products
  on conflict (id) do nothing;

  insert into public.challenges
    (id, slug, name, description, metric, target, unit, starts_on, ends_on, accent, status)
  select c.id, 'healthy-' || substr(replace(c.id::text, '-', ''), 1, 16), c.title,
    c.description || E'\nGoal: ' || c.goal,
    'actions', greatest((select count(*) from healthy_legacy.challenge_steps s where s.challenge_id = c.id), 1),
    'days', current_date, current_date + 6, 'lime',
    case when c.active then 'published'::public.content_status else 'hidden'::public.content_status end
  from healthy_legacy.challenges c
  on conflict (id) do nothing;

  insert into public.posts
    (id, title, body, audience, status, kind, circle_space, created_at)
  select id, title, left('From the Healthy Life ' || kind || E' library.\n\n' || body, 5000),
    'public', case when status = 'published' then 'published'::public.content_status
      else 'hidden'::public.content_status end,
    'note', 'trainee', created_at
  from healthy_legacy.content_items
  on conflict (id) do nothing;

  update public.community_guidelines target
  set body = source.body, updated_at = source.updated_at
  from healthy_legacy.circle_guidelines source
  where source.id = 'main' and target.id = 'main';

  for legacy_program in
    select id, member_id, name, active, schedule
    from healthy_legacy.training_programs
    order by created_at, id
  loop
    perform set_config('request.jwt.claim.sub', legacy_program.member_id::text, true);
    insert into public.trainee_programs (id, owner_id, title, description)
    values (legacy_program.id, legacy_program.member_id, left(legacy_program.name, 80), 'Imported from the Healthy Life training planner')
    on conflict (id) do nothing;

    for day_entry in select key, value from jsonb_each(legacy_program.schedule)
    loop
      if day_entry.key !~ '^[0-6]$' then
        raise exception 'Unexpected legacy weekday % in program %', day_entry.key, legacy_program.id;
      end if;
      select id into target_day from public.trainee_program_days
      where program_id = legacy_program.id and weekday = ((day_entry.key::integer + 6) % 7) + 1;
      if jsonb_array_length(day_entry.value) > 40 then
        raise exception 'Too many movements in legacy program % day %', legacy_program.id, day_entry.key;
      end if;
      if jsonb_array_length(day_entry.value) > 0 then
        update public.trainee_program_days set label = 'Training day' where id = target_day;
      end if;
      movement_position := 0;
      for movement in select value from jsonb_array_elements(day_entry.value)
      loop
        movement_position := movement_position + 1;
        custom_id := null;
        if not exists (select 1 from public.exercise_catalog where id = movement.value ->> 'exerciseId') then
          insert into public.trainee_exercises (owner_id, name, target, equipment, instructions)
          values (legacy_program.member_id, left(coalesce(nullif(movement.value ->> 'name', ''), 'Imported exercise'), 100),
            left(coalesce(movement.value ->> 'target', ''), 80), left(coalesce(movement.value ->> 'equipment', ''), 80), '')
          returning id into custom_id;
        end if;
        insert into public.trainee_program_movements
          (owner_id, day_id, catalog_exercise_id, custom_exercise_id, position, target_sets, target_reps, notes)
        values (legacy_program.member_id, target_day,
          case when custom_id is null then movement.value ->> 'exerciseId' else null end,
          custom_id, movement_position,
          least(greatest(coalesce((movement.value ->> 'sets')::integer, 3), 1), 12),
          left(coalesce(nullif(movement.value ->> 'reps', ''), '8-10'), 30),
          left(coalesce(movement.value ->> 'notes', ''), 500))
        on conflict (day_id, position) do nothing;
      end loop;
    end loop;

    if legacy_program.active then
      insert into public.trainee_schedules (owner_id, title, program_id, starts_on, is_active)
      values (legacy_program.member_id, left(legacy_program.name, 80), legacy_program.id, current_date, true)
      on conflict do nothing;
    end if;
  end loop;
  perform set_config('request.jwt.claim.sub', coalesce(prior_sub, ''), true);
end;
$$;
