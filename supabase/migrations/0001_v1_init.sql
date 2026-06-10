-- QR Platform V1 schema.
-- Already applied to the live Supabase project (mcuemtumualmvbwfcjrm).
-- Kept here so the schema is version-controlled and reproducible.

create extension if not exists "pgcrypto";

create type code_status as enum ('active','paused','archived');
create type lifecycle_stage as enum ('new','activated','habit','expansion','dormant');
create type attribution_event_type as enum ('scan','lead','purchase');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Workspace',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index workspaces_owner_idx on public.workspaces (owner_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  default_workspace_id uuid references public.workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.codes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text not null unique,
  title text not null default 'Untitled code',
  destination_url text not null,
  status code_status not null default 'active',
  lifecycle_stage lifecycle_stage not null default 'new',
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index codes_workspace_idx on public.codes (workspace_id);

create table public.code_destinations (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.codes(id) on delete cascade,
  destination_url text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index code_destinations_code_idx on public.code_destinations (code_id);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.codes(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  referrer text,
  device_type text,
  country text
);
create index scans_code_idx on public.scans (code_id);
create index scans_workspace_idx on public.scans (workspace_id);
create index scans_scanned_at_idx on public.scans (scanned_at);

-- Reserved for V2 revenue attribution. Present from day one, inert in V1.
create table public.attribution_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  code_id uuid references public.codes(id) on delete set null,
  event_type attribution_event_type not null default 'scan',
  value_cents integer not null default 0,
  currency text not null default 'USD',
  source text,
  occurred_at timestamptz not null default now()
);
create index attribution_workspace_idx on public.attribution_events (workspace_id);

-- Auto-provision a workspace + profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws_id uuid;
begin
  insert into public.workspaces (name, owner_id) values ('My Workspace', new.id) returning id into ws_id;
  insert into public.profiles (id, email, default_workspace_id) values (new.id, new.email, ws_id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic scan counter.
create or replace function public.increment_scan(p_code_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.codes set scan_count = scan_count + 1 where id = p_code_id;
$$;

-- Row Level Security
alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.codes enable row level security;
alter table public.code_destinations enable row level security;
alter table public.scans enable row level security;
alter table public.attribution_events enable row level security;

create policy "own workspaces" on public.workspaces
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own codes" on public.codes
  for all using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "own code_destinations" on public.code_destinations
  for all using (code_id in (select id from public.codes where workspace_id in (select id from public.workspaces where owner_id = auth.uid())))
  with check (code_id in (select id from public.codes where workspace_id in (select id from public.workspaces where owner_id = auth.uid())));

create policy "own scans read" on public.scans
  for select using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "own attribution read" on public.attribution_events
  for select using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));
