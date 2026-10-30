-- Synthetic local-development data. Every person, queue, message, and metric below is fictional.

insert into public.profiles (id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified)
values
  ('10000000-0000-4000-8000-000000000001', 'maya_moves', 'Maya Nasser', 'MN', 'fitsphere', 'Strength coach · movement quality', 'Dubai, UAE', 'Coach-led strength and mobility for busy training weeks.', 'coach', true),
  ('10000000-0000-4000-8000-000000000002', 'omar_builds', 'Omar Khalid', 'OK', 'coachsphere', 'Performance coach · barbell fundamentals', 'Abu Dhabi, UAE', 'Simple programming, clear feedback, and repeatable progress.', 'reward', true),
  ('10000000-0000-4000-8000-000000000003', 'lena_recovers', 'Lena Torres', 'LT', 'fitsphere', 'Mobility coach · recovery sessions', 'Dubai, UAE', 'Low-friction mobility plans for strength athletes.', 'calm', true),
  ('10000000-0000-4000-8000-000000000004', 'noor_runs', 'Noor Rahman', 'NR', 'member', 'Hybrid training · run and lift', 'Sharjah, UAE', 'Training for the next five kilometres without giving up the barbell.', 'member', false),
  ('10000000-0000-4000-8000-000000000005', 'kai_consistent', 'Kai Santos', 'KS', 'member', 'Three sessions every week', 'Dubai, UAE', 'Small wins, logged honestly.', 'member', false);

insert into public.coach_profiles (id, profile_id, coaching_type, specialties, rating, review_count, session_count, base_price, response_hours, verified_at)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'fitsphere', array['strength', 'mobility', 'live classes'], 4.92, 86, 412, 60, 8, now() - interval '14 months'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'coachsphere', array['barbell', 'hypertrophy', 'programming'], 4.88, 64, 289, 75, 12, now() - interval '9 months'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'fitsphere', array['mobility', 'recovery', 'beginner'], 4.95, 51, 201, 50, 6, now() - interval '11 months');

insert into public.coach_packages (id, coach_id, name, description, duration_weeks, session_count, price)
values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Strength reset', 'A four-week training reset with two live technique reviews.', 4, 2, 210),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Barbell foundations', 'Six weeks of individual programming and weekly form review.', 6, 6, 390),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'Move better', 'Three guided mobility sessions and a repeatable daily plan.', 3, 3, 130);

insert into public.coach_availability (id, coach_id, starts_at, ends_at)
values
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', (current_date + 2 + time '13:30') at time zone 'UTC', (current_date + 2 + time '14:15') at time zone 'UTC'),
  ('32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', (current_date + 3 + time '15:30') at time zone 'UTC', (current_date + 3 + time '16:15') at time zone 'UTC'),
  ('32000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', (current_date + 4 + time '14:30') at time zone 'UTC', (current_date + 4 + time '15:30') at time zone 'UTC'),
  ('32000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', (current_date + 5 + time '06:00') at time zone 'UTC', (current_date + 5 + time '06:45') at time zone 'UTC');

insert into public.programs (id, author_profile_id, title, slug, summary, level, weeks, sessions_per_week, accent)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Foundation strength', 'foundation-strength', 'Three deliberate full-body sessions with repeatable progressions.', 'Intermediate', 6, 3, 'cyan'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'Daily range', 'daily-range', 'Short mobility sessions that fit before or after training.', 'All levels', 4, 5, 'green'),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Barbell base', 'barbell-base', 'Practice the squat, bench, deadlift, and row with controlled volume.', 'Beginner', 8, 3, 'orange');

insert into public.program_sessions (id, program_id, week_number, day_number, title, duration_minutes, focus)
values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1, 1, 'Upper strength', 52, 'Bench · row · shoulder'),
  ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 1, 2, 'Lower strength', 58, 'Squat · hinge · lunge'),
  ('41000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', 1, 3, 'Full-body volume', 48, 'Technique · repeatable effort'),
  ('41000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', 1, 1, 'Hips and ankles', 14, 'Range before load'),
  ('41000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000003', 1, 1, 'Barbell A', 62, 'Squat · bench · row');

insert into public.program_session_exercises (session_id, exercise_id, position, target_sets, target_reps, rest_seconds)
values
  ('41000000-0000-4000-8000-000000000001', '0025', 1, 4, '6', 150),
  ('41000000-0000-4000-8000-000000000001', '0027', 2, 4, '8', 120),
  ('41000000-0000-4000-8000-000000000001', '0405', 3, 3, '10', 90),
  ('41000000-0000-4000-8000-000000000002', '0043', 1, 4, '6', 180),
  ('41000000-0000-4000-8000-000000000002', '0032', 2, 3, '5', 180),
  ('41000000-0000-4000-8000-000000000002', '1460', 3, 3, '10 / side', 90),
  ('41000000-0000-4000-8000-000000000005', '0043', 1, 3, '5', 180),
  ('41000000-0000-4000-8000-000000000005', '0025', 2, 3, '5', 150),
  ('41000000-0000-4000-8000-000000000005', '0027', 3, 3, '8', 120);

insert into public.workouts (id, name, status, scheduled_for, duration_minutes, notes, is_template)
values
  ('50000000-0000-4000-8000-000000000001', 'Upper strength', 'scheduled', (current_date + 1 + time '14:30') at time zone 'UTC', 52, 'Synthetic starter template', true),
  ('50000000-0000-4000-8000-000000000002', 'Lower strength', 'scheduled', (current_date + 3 + time '06:00') at time zone 'UTC', 58, 'Synthetic starter template', true),
  ('50000000-0000-4000-8000-000000000003', 'Recovery circuit', 'scheduled', (current_date + 2 + time '05:30') at time zone 'UTC', 24, 'Synthetic starter template', true);

insert into public.workout_exercises (id, workout_id, exercise_id, position, target_sets, target_reps, rest_seconds)
values
  ('51000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '0025', 1, 4, '6', 150),
  ('51000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', '0027', 2, 4, '8', 120),
  ('51000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000001', '0405', 3, 3, '10', 90),
  ('51000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000002', '0043', 1, 4, '6', 180),
  ('51000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000002', '0032', 2, 3, '5', 180),
  ('51000000-0000-4000-8000-000000000006', '50000000-0000-4000-8000-000000000003', '0464', 1, 3, '30 sec', 45),
  ('51000000-0000-4000-8000-000000000007', '50000000-0000-4000-8000-000000000003', '1460', 2, 2, '8 / side', 60);

insert into public.communities (id, slug, name, description, topic, member_count, post_count, accent)
values
  ('60000000-0000-4000-8000-000000000001', 'strength-room', 'Strength room', 'Programming notes, technique checks, and honest training logs.', 'Strength', 2840, 912, 'cyan'),
  ('60000000-0000-4000-8000-000000000002', 'move-every-day', 'Move every day', 'Short sessions, mobility streaks, and lower-friction plans.', 'Consistency', 3910, 1384, 'green'),
  ('60000000-0000-4000-8000-000000000003', 'dubai-runners', 'Dubai runners', 'Route notes, heat-aware pacing, and weekly meetups.', 'Running', 1640, 506, 'orange'),
  ('60000000-0000-4000-8000-000000000004', 'fuelmode-kitchen', 'Fuelmode kitchen', 'Practical meals for real training weeks.', 'Nutrition', 2180, 744, 'reward');

insert into public.posts (id, author_profile_id, community_id, title, body, kind, reaction_count, comment_count, created_at)
values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'Your warm-up should earn its place', 'Eight minutes: controlled circles, wall slides, then two light ramp sets. Save the fatigue for the work sets.', 'coach_tip', 84, 11, now() - interval '18 minutes'),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000003', 'Easy run stayed easy', 'Thirty-two minutes at conversational pace. The small win was finishing with enough energy to train tomorrow.', 'milestone', 37, 6, now() - interval '2 hours'),
  ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', 'A useful rep-speed rule', 'If the last clean rep changes the shape of the movement, the set is finished. Progress does not require a technical miss.', 'coach_tip', 112, 19, now() - interval '5 hours'),
  ('70000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000002', 'Third session done', 'Nothing dramatic—three sessions this week, all logged. That was the target.', 'milestone', 55, 8, now() - interval '1 day');

insert into public.challenges (id, slug, name, description, metric, target, unit, starts_on, ends_on, participant_count, reward_coins, accent)
values
  ('b0000000-0000-4000-8000-000000000001', 'monthly-consistency', 'Monthly consistency', 'Complete twelve movement sessions without chasing perfect weeks.', 'sessions', 12, 'sessions', current_date - 5, current_date + 25, 1284, 240, 'orange'),
  ('b0000000-0000-4000-8000-000000000002', 'mobility-seven', 'Mobility seven', 'Log ten deliberate minutes on seven different days.', 'days', 7, 'days', current_date - 2, current_date + 12, 842, 120, 'green'),
  ('b0000000-0000-4000-8000-000000000003', 'five-km-faceoff', '5 km Face-Off', 'Compare one verified five-kilometre effort with a matched training partner.', 'distance', 5, 'km', current_date, current_date + 14, 316, 180, 'cyan');

insert into public.conversations (id, title, kind, is_demo, updated_at)
values
  ('80000000-0000-4000-8000-000000000001', 'Maya · technique review', 'direct', true, now() - interval '4 minutes'),
  ('80000000-0000-4000-8000-000000000002', 'Strength room · moderators', 'group', true, now() - interval '26 minutes'),
  ('80000000-0000-4000-8000-000000000003', 'Healthy Life support', 'support', true, now() - interval '3 hours');

insert into public.messages (id, conversation_id, sender_profile_id, body, status, created_at)
values
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Keep one rep in reserve on the last set. Send the top set when you finish.', 'read', now() - interval '44 minutes'),
  ('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'Got it. I will attach the set after the session.', 'read', now() - interval '41 minutes'),
  ('81000000-0000-4000-8000-000000000003', '80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Good. The first two reps were the cleanest—match that pace.', 'sent', now() - interval '4 minutes'),
  ('81000000-0000-4000-8000-000000000004', '80000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'The weekly form-check thread is open. Keep clips under thirty seconds.', 'sent', now() - interval '26 minutes'),
  ('81000000-0000-4000-8000-000000000005', '80000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Your local demo data can be reset at any time from the Supabase CLI.', 'sent', now() - interval '3 hours');

insert into public.products (id, slug, name, description, product_type, price, coin_price, accent)
values
  ('90000000-0000-4000-8000-000000000001', 'full-circle-monthly', 'Full Circle', 'Mindflow, Fuelmode, premium programs, and class replays.', 'subscription', 15, null, 'cyan'),
  ('90000000-0000-4000-8000-000000000002', 'barbell-base-program', 'Barbell base', 'Eight-week beginner strength program with three weekly sessions.', 'program', 35, 1200, 'orange'),
  ('90000000-0000-4000-8000-000000000003', 'mobility-desk', 'Desk reset pack', 'Five guided mobility sessions for long work days.', 'digital', 12, 360, 'green'),
  ('90000000-0000-4000-8000-000000000004', 'training-log-template', 'Training log template', 'A printable twelve-week strength log.', 'digital', 5, 180, 'reward');

insert into public.operations_queue (id, reference, area, title, severity, status, owner_label, detail, updated_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'FC-2841', 'Moderation', 'Community report requires evidence review', 'high', 'review', 'Unassigned', 'Synthetic queue item; contains no member data.', now() - interval '19 minutes'),
  ('a0000000-0000-4000-8000-000000000002', 'COACH-017', 'Coaches', 'Coach verification document check', 'medium', 'review', 'A. Rahman', 'Synthetic verification record.', now() - interval '42 minutes'),
  ('a0000000-0000-4000-8000-000000000003', 'CAT-7455EFA', 'Catalog', 'Exercise import ready for approval', 'low', 'open', 'Catalog team', 'Pinned data-only snapshot; restricted media is excluded.', now() - interval '8 minutes'),
  ('a0000000-0000-4000-8000-000000000004', 'RF-0912', 'Finance', 'Refund simulation', 'medium', 'open', 'Finance', 'Sandbox-only transaction; no money moved.', now() - interval '1 hour'),
  ('a0000000-0000-4000-8000-000000000005', 'DR-0088', 'Privacy', 'Export workflow verification', 'high', 'open', 'Privacy ops', 'Synthetic request used to verify redaction and expiry.', now() - interval '3 hours');

insert into public.feature_flags (key, description, enabled, audience)
values
  ('anonymous_local_demo', 'Create an anonymous local identity for mutation testing.', true, 'local'),
  ('mindflow_reflections', 'Enable private reflection prompts.', true, 'full_circle'),
  ('fuelmode_suggestions', 'Enable non-diagnostic meal suggestions.', true, 'full_circle'),
  ('live_video_provider', 'External live-video integration boundary.', false, 'internal'),
  ('payment_provider', 'External payment integration boundary.', false, 'internal');
