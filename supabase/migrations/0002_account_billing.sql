-- Account + billing fields on the workspace.
-- Everyone defaults to the free plan. Stripe fills in the rest when paid
-- plans go live: it writes the customer id, the plan, the status, and the
-- renewal date through the billing webhook.
alter table public.workspaces
  add column if not exists plan text not null default 'free',
  add column if not exists subscription_status text,
  add column if not exists stripe_customer_id text,
  add column if not exists current_period_end timestamptz;
