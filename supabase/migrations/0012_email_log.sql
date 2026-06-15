-- Tracks lifecycle emails so each one-time email is sent at most once per
-- workspace. Service-role only.
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  email text,
  kind text not null,
  sent_at timestamptz not null default now(),
  unique (workspace_id, kind)
);

alter table public.email_log enable row level security;
