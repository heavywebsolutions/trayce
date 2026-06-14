-- Optional note from the customer when they request a change to their proof
-- during the approval step.
alter table public.print_orders
  add column if not exists proof_note text;
