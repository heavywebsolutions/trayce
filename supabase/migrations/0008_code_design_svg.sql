-- Store the composed designed code (frame + colors + logo) as an SVG so the
-- exact design can be reused in the Print & Ship preview and the print file,
-- guaranteeing what the customer designed is what gets printed.
alter table public.codes
  add column if not exists design_svg text;
