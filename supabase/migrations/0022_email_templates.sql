-- Editable lifecycle email copy. Overrides the in-code defaults; a missing row
-- means "use the default". Service-role only (admin edits + send-time reads),
-- so RLS is on with no policies.
create table if not exists public.email_templates (
  kind text primary key,
  subject text not null,
  heading text not null,
  body text not null,
  cta_text text not null,
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;
