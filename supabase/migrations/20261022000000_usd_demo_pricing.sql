-- Align existing local sample rows and new records with the USD demo catalog.
alter table public.coach_profiles alter column currency set default 'USD';
alter table public.coach_packages alter column currency set default 'USD';
alter table public.products alter column currency set default 'USD';

update public.coach_profiles set currency = 'USD', base_price = case id
  when '30000000-0000-4000-8000-000000000001' then 60
  when '30000000-0000-4000-8000-000000000002' then 75
  when '30000000-0000-4000-8000-000000000003' then 50
end
where id in ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003');

update public.coach_packages set currency = 'USD', price = case id
  when '31000000-0000-4000-8000-000000000001' then 210
  when '31000000-0000-4000-8000-000000000002' then 390
  when '31000000-0000-4000-8000-000000000003' then 130
end
where id in ('31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000003');

update public.products set currency = 'USD', price = case id
  when '90000000-0000-4000-8000-000000000001' then 15
  when '90000000-0000-4000-8000-000000000002' then 35
  when '90000000-0000-4000-8000-000000000003' then 12
  when '90000000-0000-4000-8000-000000000004' then 5
end
where id in ('90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000004');
