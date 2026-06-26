-- Booking attribution.
-- Wraps a customer's existing booker (Square / Acuity / Calendly / Booksy) and
-- makes it measurable from the physical world: tagged placements, tap
-- attribution, optional lead capture before hand-off, and mark-booked revenue.
-- Mirrors the codes / scans / leads patterns so it reuses the redirect engine,
-- analytics bucketing, and the leads inbox.

-- A booking destination. A workspace can have many (per artist / service / shop).
create table public.booking_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Bookings',
  destination_url text not null,
  capture_lead boolean not null default false,
  capture_collect_phone boolean not null default false,
  avg_value_cents integer,
  status code_status not null default 'active',
  tap_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index booking_links_workspace_idx on public.booking_links (workspace_id);

-- A tagged entry point for a booking link (window decal, flash sheet, IG bio...).
-- Each has its own slug, so the source is baked in (no visible tracking tail).
create table public.booking_placements (
  id uuid primary key default gen_random_uuid(),
  booking_link_id uuid not null references public.booking_links(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null default 'Placement',
  channel text not null default 'in_person',
  slug text not null unique,
  status code_status not null default 'active',
  tap_count integer not null default 0,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index booking_placements_link_idx on public.booking_placements (booking_link_id);
create index booking_placements_workspace_idx on public.booking_placements (workspace_id);

-- One row per tap on a placement. Mirrors public.scans.
create table public.booking_taps (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid references public.booking_placements(id) on delete set null,
  booking_link_id uuid not null references public.booking_links(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tapped_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  referrer text,
  device_type text,
  country text,
  region text,
  city text,
  lead_id uuid references public.leads(id) on delete set null
);
create index booking_taps_placement_idx on public.booking_taps (placement_id);
create index booking_taps_link_idx on public.booking_taps (booking_link_id);
create index booking_taps_workspace_idx on public.booking_taps (workspace_id);
create index booking_taps_tapped_at_idx on public.booking_taps (tapped_at);

-- Tie captured leads + booked-revenue back to a placement / booking link.
alter table public.leads
  add column if not exists booking_link_id uuid references public.booking_links(id) on delete set null,
  add column if not exists placement_id uuid references public.booking_placements(id) on delete set null,
  add column if not exists booked boolean not null default false,
  add column if not exists booked_value_cents integer,
  add column if not exists booked_at timestamptz;
create index if not exists leads_placement_idx on public.leads (placement_id);
create index if not exists leads_booking_link_idx on public.leads (booking_link_id);

-- Atomic tap counters (placement + parent link in one call).
create or replace function public.increment_booking_tap(p_placement_id uuid, p_booking_link_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.booking_placements set tap_count = tap_count + 1 where id = p_placement_id;
  update public.booking_links set tap_count = tap_count + 1 where id = p_booking_link_id;
$$;
-- Only the service-role client (redirect/tap engine) may bump counters, mirrors
-- increment_scan. Keeps anon/authenticated from inflating counts via the RPC.
revoke execute on function public.increment_booking_tap(uuid, uuid) from public, anon, authenticated;
grant execute on function public.increment_booking_tap(uuid, uuid) to service_role;

-- Row Level Security (owner-scoped, mirrors codes/scans).
alter table public.booking_links enable row level security;
alter table public.booking_placements enable row level security;
alter table public.booking_taps enable row level security;

create policy "own booking_links" on public.booking_links
  for all using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "own booking_placements" on public.booking_placements
  for all using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "own booking_taps read" on public.booking_taps
  for select using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- Owners can mark their own captured leads as booked (+ value). The leads table
-- previously had only read + delete owner policies.
create policy "own leads update" on public.leads
  for update using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));
