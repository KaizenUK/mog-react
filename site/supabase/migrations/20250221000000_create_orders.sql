-- MOG orders table
-- Receives order requests from the product page basket.
-- No payment is processed here; sales team contacts customer for payment.

create table if not exists public.orders (
  id                    uuid          primary key default gen_random_uuid(),
  created_at            timestamptz   not null default now(),
  status                text          not null default 'new',  -- new | contacted | paid | fulfilled | cancelled

  -- Product
  product_title         text          not null,
  product_slug          text          not null,
  size_label            text          not null,   -- e.g. "200L" or "Multiple sizes"
  sku                   text,
  quantity              integer       not null default 1,
  basket_items          text,                     -- JSON: [{size, sku, qty}] for multi-line orders

  -- Customer
  customer_name         text          not null,
  customer_company      text,
  customer_email        text          not null,
  customer_phone        text          not null,

  -- Delivery address
  delivery_address_line1 text         not null,
  delivery_address_line2 text,
  delivery_town          text         not null,
  delivery_county        text,
  delivery_postcode      text         not null,

  -- Notes
  notes                 text,

  -- Internal
  sales_notes           text,         -- for internal team use
  contacted_at          timestamptz,
  fulfilled_at          timestamptz
);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Anonymous users can INSERT only (no reads, no updates, no deletes).
-- Authenticated users (your team) can do everything via the Supabase dashboard.

alter table public.orders enable row level security;

create policy "anon_can_insert_orders"
  on public.orders
  for insert
  to anon
  with check (true);

-- ── Useful indexes ───────────────────────────────────────────────────────────

create index orders_status_idx       on public.orders (status);
create index orders_created_at_idx   on public.orders (created_at desc);
create index orders_customer_email_idx on public.orders (customer_email);
