-- Atomic server-only workflows for the simulated checkout release.
alter table public.payment_transactions add column refunded_amount numeric(10,2) not null default 0 check (refunded_amount >= 0);

create function public.create_simulated_booking(p_member uuid, p_slot uuid, p_format text)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_slot public.availability_slots%rowtype;
  v_expert public.expert_profiles%rowtype;
  v_policy public.policy_versions%rowtype;
  v_booking uuid;
  v_approved boolean;
begin
  if not exists(select 1 from public.role_grants where user_id=p_member and role='member') then
    raise exception 'Member role required';
  end if;
  select * into v_slot from public.availability_slots where id=p_slot;
  if not found or v_slot.starts_at <= now() then raise exception 'Slot unavailable'; end if;
  select * into v_expert from public.expert_profiles where user_id=v_slot.expert_id;
  if not found then raise exception 'Expert unavailable'; end if;
  select r.status='approved' into v_approved from public.expert_reviews r
    where r.expert_id=v_slot.expert_id order by r.created_at desc,r.id desc limit 1;
  if not coalesce(v_approved,false) then raise exception 'Expert is not approved'; end if;
  if not p_format = any(v_expert.formats) then raise exception 'Service format unavailable'; end if;
  select * into v_policy from public.policy_versions order by version desc limit 1;
  if not found then raise exception 'Booking policy unavailable'; end if;
  insert into public.bookings(member_id,expert_id,slot_id,service_format,status,price,currency,policy_version)
    values(p_member,v_slot.expert_id,p_slot,p_format,'confirmed',v_expert.session_price,v_expert.currency,v_policy.version)
    returning id into v_booking;
  insert into public.payment_transactions(booking_id,status,amount,currency,provider,provider_reference)
    values(v_booking,'authorized',v_expert.session_price,v_expert.currency,'simulation','sim_'||v_booking::text);
  insert into public.payouts(booking_id,expert_id,status,amount)
    values(v_booking,v_slot.expert_id,'pending',round(v_expert.session_price*(1-v_policy.commission_percent/100),2));
  insert into public.conversations(booking_id) values(v_booking);
  insert into public.audit_events(actor_id,action,subject_type,subject_id,detail)
    values(p_member,'simulated_booking_created','booking',v_booking,jsonb_build_object('policy_version',v_policy.version));
  return v_booking;
end;
$$;
revoke all on function public.create_simulated_booking(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.create_simulated_booking(uuid,uuid,text) to service_role;

create function public.cancel_simulated_booking(p_actor uuid, p_booking uuid)
returns numeric language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_booking public.bookings%rowtype;
  v_start timestamptz;
  v_policy public.policy_versions%rowtype;
  v_refund numeric(10,2);
  v_is_admin boolean;
begin
  select * into v_booking from public.bookings where id=p_booking for update;
  if not found or v_booking.status <> 'confirmed' then raise exception 'Booking cannot be cancelled'; end if;
  select exists(select 1 from public.role_grants where user_id=p_actor and role='admin') into v_is_admin;
  if p_actor <> v_booking.member_id and p_actor <> v_booking.expert_id and not v_is_admin then
    raise exception 'Not a booking participant';
  end if;
  select starts_at into v_start from public.availability_slots where id=v_booking.slot_id;
  select * into v_policy from public.policy_versions where version=v_booking.policy_version;
  v_refund := case
    when p_actor=v_booking.expert_id or v_is_admin or v_start-now() >= make_interval(hours=>v_policy.free_cancellation_hours)
    then v_booking.price
    else round(v_booking.price*(1-v_policy.late_fee_percent/100),2)
  end;
  update public.bookings set status='cancelled',updated_at=now() where id=p_booking;
  update public.payment_transactions set status=case when v_refund=v_booking.price then 'refunded' else 'partially_refunded' end,
    refunded_amount=v_refund where booking_id=p_booking;
  update public.payouts set status='held' where booking_id=p_booking;
  insert into public.audit_events(actor_id,action,subject_type,subject_id,detail)
    values(p_actor,'simulated_booking_cancelled','booking',p_booking,
      jsonb_build_object('refund_amount',v_refund,'expert_late',p_actor=v_booking.expert_id and v_start-now()<interval '24 hours'));
  return v_refund;
end;
$$;
revoke all on function public.cancel_simulated_booking(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_simulated_booking(uuid,uuid) to service_role;

create function public.complete_simulated_booking(p_actor uuid, p_booking uuid)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings where id=p_booking for update;
  if not found or v_booking.status <> 'confirmed' then raise exception 'Booking cannot be completed'; end if;
  if p_actor <> v_booking.expert_id and not exists(select 1 from public.role_grants where user_id=p_actor and role='admin') then
    raise exception 'Expert or admin role required';
  end if;
  update public.bookings set status='completed',updated_at=now() where id=p_booking;
  update public.payment_transactions set status='settled' where booking_id=p_booking;
  update public.payouts set status='held' where booking_id=p_booking;
  insert into public.audit_events(actor_id,action,subject_type,subject_id)
    values(p_actor,'session_marked_complete','booking',p_booking);
end;
$$;
revoke all on function public.complete_simulated_booking(uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_simulated_booking(uuid,uuid) to service_role;

create function public.resolve_simulated_booking(p_member uuid, p_booking uuid, p_dispute boolean)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_booking public.bookings%rowtype;
begin
  select * into v_booking from public.bookings where id=p_booking for update;
  if not found or v_booking.member_id<>p_member or v_booking.status<>'completed' then
    raise exception 'Completed member booking required';
  end if;
  if p_dispute then
    update public.bookings set status='disputed',updated_at=now() where id=p_booking;
    update public.payouts set status='held' where booking_id=p_booking;
  else
    update public.payouts set status='eligible' where booking_id=p_booking;
  end if;
  insert into public.audit_events(actor_id,action,subject_type,subject_id)
    values(p_member,case when p_dispute then 'session_disputed' else 'session_confirmed' end,'booking',p_booking);
end;
$$;
revoke all on function public.resolve_simulated_booking(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.resolve_simulated_booking(uuid,uuid,boolean) to service_role;

create function public.create_simulated_order(p_member uuid, p_product uuid, p_quantity integer)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_product public.products%rowtype; v_order uuid;
begin
  if p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  if not exists(select 1 from public.role_grants where user_id=p_member and role='member') then raise exception 'Member role required'; end if;
  select * into v_product from public.products where id=p_product for update;
  if not found or not v_product.active or v_product.stock<p_quantity then raise exception 'Product unavailable'; end if;
  update public.products set stock=stock-p_quantity where id=p_product;
  insert into public.orders(member_id,status,total,currency)
    values(p_member,'placed',v_product.price*p_quantity,v_product.currency) returning id into v_order;
  insert into public.order_items(order_id,product_id,quantity,unit_price)
    values(v_order,p_product,p_quantity,v_product.price);
  insert into public.audit_events(actor_id,action,subject_type,subject_id)
    values(p_member,'simulated_order_created','order',v_order);
  return v_order;
end;
$$;
revoke all on function public.create_simulated_order(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.create_simulated_order(uuid,uuid,integer) to service_role;
