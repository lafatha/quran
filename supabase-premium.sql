-- Supabase schema for Mufassir AI premium access and daily prompt usage
-- Run this in your Supabase project's SQL editor or migrations.

create table if not exists public.premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  is_premium boolean not null default false,
  activated_at timestamptz,
  provider text not null default 'mayar',
  mayar_invoice_id text,
  mayar_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_prompt_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  prompt_count integer not null default 0,
  upgrade_declined boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_prompt_usage_user_date_unique unique (user_id, usage_date)
);

-- RLS: allow users to read/insert/update only their own rows
alter table public.premium_subscriptions enable row level security;
alter table public.ai_prompt_usage enable row level security;

create policy "Users can manage own premium_subscriptions"
  on public.premium_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own ai_prompt_usage"
  on public.ai_prompt_usage for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

