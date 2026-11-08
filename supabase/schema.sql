-- Run once in your own Supabase project. Uses the authenticated public key, never a service role key.
create table if not exists public.learning_events (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('attempt','review','conversation')),
 created_at timestamptz not null,
 data jsonb not null
);
create index if not exists learning_events_owner_time on public.learning_events(user_id,created_at,id);
alter table public.learning_events enable row level security;
drop policy if exists own_events_read on public.learning_events;
create policy own_events_read on public.learning_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists own_events_insert on public.learning_events;
create policy own_events_insert on public.learning_events for insert to authenticated with check ((select auth.uid()) = user_id);
revoke all on public.learning_events from anon;
revoke update,delete on public.learning_events from authenticated;
grant select,insert on public.learning_events to authenticated;
