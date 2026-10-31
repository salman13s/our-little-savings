-- Create your admin user in Supabase Authentication > Users first.
-- Then mark that user as admin with the UPDATE statement in README.md.
create extension if not exists pgcrypto;

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  deposit_date date not null default current_date,
  note text check (char_length(note) <= 180),
  created_at timestamptz not null default now()
);

alter table public.deposits enable row level security;

create policy "signed-in users can view deposits"
on public.deposits for select
to authenticated
using (true);

create policy "admin can add deposits"
on public.deposits for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin can update deposits"
on public.deposits for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin can delete deposits"
on public.deposits for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- OPTION A: anyone with the link can view (read-only).
-- To enable password-protected viewing instead, drop this policy.
create policy "public can view deposits"
on public.deposits for select
to anon
using (true);
