-- The Healthy Life app does not include FitLoop. Remove its private manual
-- tracking tables after the imported FitCircle migration chain has run.
drop table if exists public.fitloop_entries;
drop table if exists public.fitloop_targets;
