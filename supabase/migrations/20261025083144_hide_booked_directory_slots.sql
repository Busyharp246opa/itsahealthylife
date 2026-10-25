create function private.is_slot_open(requested_slot uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select not exists (
    select 1 from public.bookings b where b.slot_id = requested_slot
      and b.status in ('confirmed','completed','disputed')
  );
$$;
revoke all on function private.is_slot_open(uuid) from public;
grant execute on function private.is_slot_open(uuid) to authenticated;

drop policy slots_read on public.availability_slots;
create policy slots_read on public.availability_slots for select to authenticated using (
  expert_id = (select auth.uid()) or private.has_role('admin')
  or (private.is_approved_expert(expert_id) and private.is_slot_open(id))
);
