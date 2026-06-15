-- Public storage bucket for bio-page images (image blocks, link thumbnails).
-- Public read so the published page can show them; writes happen via the
-- service-role server action, which bypasses storage RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bio-media',
  'bio-media',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
