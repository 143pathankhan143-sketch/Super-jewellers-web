-- Super Jewellers schema for Supabase (PostgreSQL).
-- Run in Supabase SQL Editor as project owner. Then follow README.md to add your admin UUID.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- No client INSERT/UPDATE/DELETE policies: admin membership is granted only by project owner in SQL Editor.
create policy "Admins can read their own membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.categories (
  name text primary key check (length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Categories are visible publicly" on public.categories
  for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  category text not null references public.categories(name) on update cascade on delete restrict,
  description text not null check (length(trim(description)) between 1 and 1000),
  price numeric(12,2) not null default 0 check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
alter table public.products enable row level security;
create policy "Public can read active products" on public.products
  for select to anon, authenticated using (is_active = true);
create policy "Admins can read all products" on public.products
  for select to authenticated using ((select public.is_admin()));
create policy "Admins can create products" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update products" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete products" on public.products
  for delete to authenticated using ((select public.is_admin()));

insert into public.categories(name) values ('Gold'),('Silver'),('Diamond'),('Bridal')
on conflict (name) do nothing;

-- Explicit API grants: RLS policies above remain the row-level security boundary.
grant select on public.products, public.categories to anon, authenticated;
grant insert, update, delete on public.products, public.categories to authenticated;
grant select on public.admin_users to authenticated;

-- Publicly readable product photos; only listed admins may write/remove objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Product images are publicly readable" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "Admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin())) with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));

-- Cached daily India spot indicative rates. The public may read; only the Edge Function
-- service role writes, so no client insert/update policies are provided.
create table if not exists public.metal_rates (
  city text primary key,
  gold_24k_per_10g numeric(12,2) not null,
  gold_22k_per_10g numeric(12,2) not null,
  silver_per_kg numeric(14,2) not null,
  rate_date date not null,
  fetched_at timestamptz not null default now(),
  provider_computed_at timestamptz,
  is_stale boolean not null default false,
  confidence text,
  source text not null default 'goldprice.dev spot benchmark'
);
alter table public.metal_rates enable row level security;
create policy "Public can read cached metal rates" on public.metal_rates
  for select to anon, authenticated using (true);
grant select on public.metal_rates to anon, authenticated;

-- IMPORTANT: create one admin login in Authentication > Users (never enable public sign-up),
-- then insert that user's UUID into public.admin_users using the owner SQL Editor.
-- Example (replace with the real UUID):
-- insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');
