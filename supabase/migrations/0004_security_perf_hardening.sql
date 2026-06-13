-- Hardening step 1: lock down public-callable SECURITY DEFINER functions and
-- add covering indexes for foreign keys flagged by the performance advisor.
--
-- The increment_* functions are only ever called by the service role (the
-- redirect engine and the bio view/click logging). Revoking public execute
-- stops anonymous users from inflating scan or click counts via the REST RPC.
-- handle_new_user is a signup trigger and keeps firing regardless of grants.

revoke execute on function public.increment_scan(uuid) from public, anon, authenticated;
grant execute on function public.increment_scan(uuid) to service_role;

revoke execute on function public.increment_bio_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_bio_view(uuid) to service_role;

revoke execute on function public.increment_bio_click(uuid) from public, anon, authenticated;
grant execute on function public.increment_bio_click(uuid) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index if not exists attribution_events_code_id_idx on public.attribution_events (code_id);
create index if not exists attribution_events_scan_id_idx on public.attribution_events (scan_id);
create index if not exists bio_events_link_id_idx on public.bio_events (link_id);
create index if not exists bio_events_workspace_id_idx on public.bio_events (workspace_id);
create index if not exists bio_links_workspace_id_idx on public.bio_links (workspace_id);
create index if not exists code_destinations_changed_by_idx on public.code_destinations (changed_by);
create index if not exists leads_bio_link_id_idx on public.leads (bio_link_id);
create index if not exists profiles_default_workspace_id_idx on public.profiles (default_workspace_id);
