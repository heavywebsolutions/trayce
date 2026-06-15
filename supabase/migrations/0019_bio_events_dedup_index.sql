-- Speeds up the "has this visitor viewed this page in the last 30 min" dedup
-- lookup added to the public bio page view tracking.
create index if not exists bio_events_dedup_idx
  on public.bio_events (page_id, ip_hash, created_at)
  where type = 'view';
