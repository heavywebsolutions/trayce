-- Optional expiration for promo (comp) codes. Null = never expires.
alter table public.promo_codes
  add column if not exists expires_at timestamptz;
