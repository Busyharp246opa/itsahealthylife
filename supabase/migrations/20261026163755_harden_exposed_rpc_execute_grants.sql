-- Supabase's default function grants include anon even when earlier migrations
-- revoked PUBLIC. These RPCs require a signed session or an operator role.
revoke execute on function public.delete_my_account(text),
  public.load_member_demo_history(),
  public.operator_set_feature_flag(text, boolean),
  public.operator_update_case(uuid, public.case_status, text)
from anon;

-- The Auth insert trigger runs as its owner; no API role needs to call it.
revoke execute on function public.handle_new_user()
from public, anon, authenticated, service_role;
