-- Credential and price edits must create a new review. The authenticated client
-- can submit drafts through platform-api, which writes a submitted review.
revoke update(specialty,bio,credentials,formats,session_price,currency)
  on public.expert_profiles from authenticated;
drop policy expert_update on public.expert_profiles;
