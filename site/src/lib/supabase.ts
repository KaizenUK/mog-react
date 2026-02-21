// site/src/lib/supabase.ts
//
// Supabase browser client — used in React islands for order submission.
// The anon key is safe to expose client-side as long as Row Level Security
// is configured to allow INSERT-only for anonymous users.
//
// Required env vars (add to site/.env):
//   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   PUBLIC_SUPABASE_ANON_KEY=your-anon-key
//
// Supabase orders table DDL (run in Supabase SQL editor):
// ----------------------------------------------------------
// create table orders (
//   id uuid default gen_random_uuid() primary key,
//   created_at timestamptz default now(),
//   status text default 'new',
//   product_title text not null,
//   product_slug text not null,
//   size_label text not null,          -- "Multiple sizes" when basket has several
//   sku text,
//   quantity integer not null default 1,
//   basket_items text,                 -- JSON array: [{size, sku, qty}] for multi-size orders
//   customer_name text not null,
//   customer_company text,
//   customer_email text not null,
//   customer_phone text not null,
//   delivery_address_line1 text not null,
//   delivery_address_line2 text,
//   delivery_town text not null,
//   delivery_county text,
//   delivery_postcode text not null,
//   notes text
// );
//
// -- Enable RLS and allow anon inserts only:
// alter table orders enable row level security;
// create policy "Allow anonymous order inserts" on orders
//   for insert to anon with check (true);
//
// -- Email notifications via Resend:
// Set up a Supabase Database Webhook (Dashboard > Database > Webhooks)
// pointing to a Supabase Edge Function that calls Resend to email sales.
// See: https://supabase.com/docs/guides/functions/schedule-functions
// ----------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — client is only constructed the first time submitOrder() is
// called, so missing env vars during the static build don't throw at import time.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !key) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Supabase] Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add these to site/.env — order submission will be unavailable until then.'
      );
    }
    return null;
  }

  _client = createClient(url, key);
  return _client;
}

export type OrderInsert = {
  product_title: string;
  product_slug: string;
  size_label: string;       // "Multiple sizes" when basket has several lines
  sku?: string;
  quantity: number;         // total across all basket lines
  basket_items?: string;    // JSON: [{size, sku, qty}]
  customer_name: string;
  customer_company?: string;
  customer_email: string;
  customer_phone: string;
  delivery_address_line1: string;
  delivery_address_line2?: string;
  delivery_town: string;
  delivery_county?: string;
  delivery_postcode: string;
  notes?: string;
};

export async function submitOrder(order: OrderInsert): Promise<{ error: string | null }> {
  const client = getClient();

  if (!client) {
    return { error: 'Order service is not configured yet. Please call us directly.' };
  }

  const { error } = await client.from('orders').insert(order);
  if (error) {
    console.error('[Supabase] Order insert error:', error);
    return { error: error.message };
  }
  return { error: null };
}
