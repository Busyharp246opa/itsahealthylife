-- Switch the active member program atomically so a failed request cannot leave
-- the member with an unintended selection.
create function public.activate_training_program(p_program_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_member_id uuid := (select auth.uid());
begin
  if v_member_id is null or not exists (
    select 1 from public.training_programs
    where id = p_program_id and member_id = v_member_id
  ) then
    raise exception 'Training program not found';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_member_id::text, 0));
  update public.training_programs set active = false
    where member_id = v_member_id and active and id <> p_program_id;
  update public.training_programs set active = true
    where id = p_program_id and member_id = v_member_id;
end;
$$;
revoke all on function public.activate_training_program(uuid) from public, anon;
grant execute on function public.activate_training_program(uuid) to authenticated;
