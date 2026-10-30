-- The RPC only updates the caller's own RLS-visible programs, so it can run
-- as the caller and remain atomic without SECURITY DEFINER privileges.
alter function public.activate_training_program(uuid) security invoker;
