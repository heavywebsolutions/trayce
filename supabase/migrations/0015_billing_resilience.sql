-- Billing resilience: keep paid access during the dunning window and warn
-- customers before a card expires.
--
--  - card_* : the card on file, captured from Stripe on checkout and on each
--    successful payment, so we can show "Visa ending 4242, expires 03/27" and
--    send an advance warning before it lapses.
--  - payment_failed_at : set when a renewal invoice fails, cleared on the next
--    success. Drives the grace period (we keep the plan while past_due) and the
--    in-app dunning banner.
alter table workspaces
  add column if not exists card_brand text,
  add column if not exists card_last4 text,
  add column if not exists card_exp_month int,
  add column if not exists card_exp_year int,
  add column if not exists payment_failed_at timestamptz;

comment on column workspaces.payment_failed_at is
  'Set when a renewal invoice fails; cleared on the next successful payment. Drives the dunning banner + grace period.';
