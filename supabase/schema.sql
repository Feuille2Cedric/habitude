create extension if not exists pgcrypto;

create table if not exists public.habits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    description text not null default '',
    color text not null,
    icon text not null,
    history jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists set_habits_updated_at on public.habits;

create trigger set_habits_updated_at
before update on public.habits
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.habits enable row level security;

drop policy if exists "Users can read their own habits" on public.habits;
create policy "Users can read their own habits"
on public.habits
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own habits" on public.habits;
create policy "Users can insert their own habits"
on public.habits
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own habits" on public.habits;
create policy "Users can update their own habits"
on public.habits
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own habits" on public.habits;
create policy "Users can delete their own habits"
on public.habits
for delete
to authenticated
using ((select auth.uid()) = user_id);
