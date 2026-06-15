-- No-card reverse trial: every workspace gets 14 days of Growth from creation.
-- New signups inherit the default; existing rows are granted a fresh 14 days.
alter table public.workspaces
  add column if not exists trial_ends_at timestamptz default (now() + interval '14 days');
