-- Per-block show/hide. Hidden blocks stay in the editor but are skipped on the
-- public page, so a user can pause a link without deleting it.
alter table public.bio_links
  add column if not exists hidden boolean not null default false;
