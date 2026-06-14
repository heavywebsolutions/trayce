-- Track the Stripe subscription id and whether it is set to cancel at the end
-- of the current period, so the app can render accurate in-product billing
-- state (active / cancels on <date> / canceled) and drive native plan actions.
alter table workspaces
  add column if not exists stripe_subscription_id text,
  add column if not exists cancel_at_period_end boolean not null default false;
