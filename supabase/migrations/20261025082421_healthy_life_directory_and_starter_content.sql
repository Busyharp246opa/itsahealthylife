-- Approved experts are discoverable; booked participants may see one another's names.
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or private.has_role('admin')
  or private.is_approved_expert(id)
  or exists (
    select 1 from public.bookings b
    where b.status in ('confirmed','completed','disputed')
      and ((b.member_id = id and b.expert_id = (select auth.uid()))
        or (b.expert_id = id and b.member_id = (select auth.uid())))
  )
);

-- Starter catalogue makes the first connected member session useful.
insert into public.content_items(kind,title,body,category,status,published_at) values
  ('article','Build a rhythm that lasts','Choose a small action you can repeat this week. Track how you feel, leave space for rest, and adjust your goal as your routine changes.','Wellbeing','published',now()),
  ('recipe','Colorful breakfast bowl','Combine plain yoghurt, oats, berries, and chopped nuts. Adjust portions to your needs and check ingredients for allergies.','Nutrition','published',now()),
  ('workout','Gentle movement break','Warm up for five minutes, alternate comfortable walking with light mobility, then cool down. Stop if a movement causes pain.','Movement','published',now());

with challenge as (
  insert into public.challenges(title,description,goal,active)
  values ('Seven days of small steps','A flexible week of movement, nourishment, and reflection.','Complete one simple action each day',true)
  returning id
)
insert into public.challenge_steps(challenge_id,ordinal,title)
select challenge.id,steps.ordinal,steps.title from challenge cross join (
  values (1,'Choose a personal goal'),(2,'Take a comfortable walk'),(3,'Prepare a balanced meal'),
         (4,'Try a short mobility break'),(5,'Make time to rest'),(6,'Check in on your progress'),(7,'Celebrate one change')
) as steps(ordinal,title);

insert into public.products(name,description,price,currency,stock,active) values
  ('Wellness journal','A simple space for habits, reflections, and weekly goals.',18.00,'USD',25,true),
  ('Resistance band set','Three bands for adjustable home movement.',24.00,'USD',18,true),
  ('Insulated water bottle','A reusable bottle for everyday hydration.',22.00,'USD',30,true);
