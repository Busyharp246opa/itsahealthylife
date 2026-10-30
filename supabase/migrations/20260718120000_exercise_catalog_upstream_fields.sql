alter table public.exercise_catalog
  add column category text not null default '',
  add column instructions_by_locale jsonb not null default '{}'::jsonb,
  add column instruction_steps_by_locale jsonb not null default '{}'::jsonb,
  add column media_id text not null default '',
  add column image_path text not null default '',
  add column gif_path text not null default '',
  add column media_attribution text not null default '',
  add column source_created_at timestamptz,
  add column source_url text not null default 'https://github.com/hasaneyldrm/exercises-dataset',
  add column source_license text not null default 'MIT (data and instruction text only)',
  add column media_license_status text not null default 'license_required';

update public.exercise_catalog
set
  category = body_part,
  instructions_by_locale = jsonb_build_object('en', instructions),
  instruction_steps_by_locale = jsonb_build_object('en', to_jsonb(steps));

alter table public.exercise_catalog
  add constraint exercise_catalog_category_matches_body_part check (category = body_part),
  add constraint exercise_catalog_instruction_locales_object check (jsonb_typeof(instructions_by_locale) = 'object'),
  add constraint exercise_catalog_step_locales_object check (jsonb_typeof(instruction_steps_by_locale) = 'object'),
  add constraint exercise_catalog_image_path_relative check (image_path = '' or image_path ~ '^images/.+\.(jpg|jpeg|png)$'),
  add constraint exercise_catalog_gif_path_relative check (gif_path = '' or gif_path ~ '^videos/.+\.gif$'),
  add constraint exercise_catalog_media_license_status check (media_license_status in ('license_required', 'licensed'));

create index exercise_catalog_category_idx on public.exercise_catalog(category);
create index exercise_catalog_target_idx on public.exercise_catalog(target);

create or replace function public.get_exercise_facets()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', item.category, 'count', item.count) order by item.category)
      from (select category, count(*)::integer as count from public.exercise_catalog where is_active group by category) item
    ), '[]'::jsonb),
    'equipment', coalesce((
      select jsonb_agg(jsonb_build_object('name', item.equipment, 'count', item.count) order by item.equipment)
      from (select equipment, count(*)::integer as count from public.exercise_catalog where is_active group by equipment) item
    ), '[]'::jsonb),
    'targets', coalesce((
      select jsonb_agg(jsonb_build_object('name', item.target, 'count', item.count) order by item.target)
      from (select target, count(*)::integer as count from public.exercise_catalog where is_active group by target) item
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.get_exercise_facets() to anon, authenticated;
