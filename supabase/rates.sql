-- Safe, repeatable migration for projects where the original schema.sql was already run.
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
alter table public.metal_rates add column if not exists provider_computed_at timestamptz;
alter table public.metal_rates add column if not exists is_stale boolean not null default false;
alter table public.metal_rates enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'metal_rates'
      and policyname = 'Public can read cached metal rates'
  ) then
    create policy "Public can read cached metal rates" on public.metal_rates
      for select to anon, authenticated using (true);
  end if;
end $$;

grant select on public.metal_rates to anon, authenticated;
