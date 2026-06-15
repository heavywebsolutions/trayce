-- Bio-page pause-and-choose for the freemium downgrade.
-- When a free workspace ends up over its bio-page limit, the owner picks one
-- page to keep active; the rest are parked (paused = true). Public visits to a
-- paused page redirect to the workspace's active page. Paid / trial / comp
-- plans have unlimited pages, so this flag is ignored for them.
alter table bio_pages
  add column if not exists paused boolean not null default false;

comment on column bio_pages.paused is
  'When true (free plan over its page limit), the page is parked: public visits redirect to the workspace active page. Ignored on paid/trial/comp plans.';
