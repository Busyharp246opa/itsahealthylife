-- The local admin client uses the service role after a server-side super-admin check.
grant all on public.support_tickets,
  public.support_messages, public.community_guidelines, public.user_blocks,
  public.post_reports, public.notification_campaigns to service_role;
grant all on public.notifications to service_role;
