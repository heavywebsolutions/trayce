-- Promo codes v2: comp (full free), percent, or amount discounts, scoped by
-- product domain (subscription vs print).
alter table public.promo_codes
  add column if not exists kind text not null default 'comp',
  add column if not exists domain text not null default 'subscription',
  add column if not exists comp_plans text[] not null default '{}',
  add column if not exists percent_off int,
  add column if not exists amount_off_cents int,
  add column if not exists duration text,
  add column if not exists duration_months int,
  add column if not exists applies_to_plans text[] not null default '{}',
  add column if not exists stripe_coupon_id text,
  add column if not exists stripe_promotion_code_id text;

-- Legacy rows had a required single plan; new comp codes use comp_plans.
alter table public.promo_codes alter column plan drop not null;

-- Backfill: existing comp rows -> kind comp, comp_plans from their plan.
update public.promo_codes
  set kind = 'comp',
      domain = 'subscription',
      comp_plans = case when plan is not null then array[plan] else comp_plans end
  where kind = 'comp' and (comp_plans = '{}' or comp_plans is null);
