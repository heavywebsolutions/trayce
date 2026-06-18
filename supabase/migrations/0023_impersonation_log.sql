-- Audit trail for admin "log in as" (impersonation) start/stop events.
-- Service-role only (writes happen from admin server actions).
create table if not exists public.impersonation_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text,
  target_email text,
  action text not null,
  at timestamptz not null default now()
);

alter table public.impersonation_log enable row level security;
