-- Buyer email captured at checkout, used for proof-ready and shipped order
-- notifications.
alter table print_orders
  add column if not exists customer_email text;
