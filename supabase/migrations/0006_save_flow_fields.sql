-- Support the cancellation save flow: track when a paused subscription resumes
-- and capture the last cancellation reason for churn analysis.
alter table workspaces
  add column if not exists paused_until timestamptz,
  add column if not exists cancel_reason text;
