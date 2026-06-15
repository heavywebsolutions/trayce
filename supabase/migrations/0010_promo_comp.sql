-- Comp flag: a workspace on a free-forever plan granted via promo code. Never
-- billed, never auto-downgraded.
alter table public.workspaces
  add column if not exists comp boolean not null default false;

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  plan text not null,
  label text,
  max_redemptions int,
  redeemed_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code, workspace_id)
);

-- Managed only via the service role (admin UI + redeem actions). RLS on with no
-- policies denies all direct client access.
alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
