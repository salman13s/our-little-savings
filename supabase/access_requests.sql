-- Run this in Supabase SQL Editor after the existing deposits policies are configured.
-- Access requests are handled only by the access-request Edge Function (service role).
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254),
  name text not null check (char_length(name) between 1 and 80),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index if not exists one_pending_request_per_email
on public.access_requests (lower(email)) where status = 'pending';

alter table public.access_requests enable row level security;
-- Intentionally create NO anon/authenticated policies. The Edge Function uses
-- the service-role key server-side after validating admin actions.

-- Ensure there is no anonymous read policy on the savings data.
drop policy if exists "public can view deposits" on public.deposits;
