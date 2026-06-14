-- Print & Ship: physical product orders. Customers read their own; the Stripe
-- webhook (on purchase) and the fulfillment queue (on status changes) write via
-- the service role, which bypasses RLS.
create table if not exists public.print_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code_id uuid references public.codes(id) on delete set null,
  product_key text not null,
  product_name text not null,
  options jsonb not null default '{}'::jsonb,
  quantity int not null,
  unit_price_cents int not null,
  total_cents int not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  stripe_session_id text,
  shipping jsonb,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz
);

create index if not exists print_orders_workspace_id_idx on public.print_orders (workspace_id);
create index if not exists print_orders_status_idx on public.print_orders (status);
create index if not exists print_orders_stripe_session_idx on public.print_orders (stripe_session_id);
create index if not exists print_orders_code_id_idx on public.print_orders (code_id);

alter table public.print_orders enable row level security;

create policy "own print_orders read" on public.print_orders
  for select using (
    workspace_id in (
      select id from public.workspaces where owner_id = (select auth.uid())
    )
  );
