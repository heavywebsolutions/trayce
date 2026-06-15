-- Auto-fetched link thumbnails (favicons). thumbnail_auto distinguishes an
-- automatically pulled favicon from a thumbnail the user uploaded, so a manual
-- override is never clobbered when the link URL changes.
alter table bio_links
  add column if not exists thumbnail_auto boolean not null default false;
