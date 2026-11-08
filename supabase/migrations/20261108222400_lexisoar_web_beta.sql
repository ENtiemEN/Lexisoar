-- LexiSoar private web beta. PostgreSQL persists the complete versioned workspace.
-- Runtime correction remains server-side; authenticated clients have no write grants.
create schema if not exists lexisoar_private;
revoke all on schema lexisoar_private from public;
grant usage on schema lexisoar_private to authenticated;

create table public.lexisoar_invites (
 email text primary key check (email=lower(email)), enabled boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.lexisoar_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name)<=200)
);
create table public.lexisoar_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 0, state jsonb not null default '{}'::jsonb,
 import_hash text, updated_at timestamptz not null default now(),
 check(jsonb_typeof(state)='object'), check(octet_length(state::text)<=20000000)
);
create table public.lexisoar_recordings (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 bytes bigint not null check(bytes between 1 and 10000000),
 mime text not null check(mime in ('audio/webm','audio/ogg','audio/mp4')),
 status text not null default 'pending' check(status in ('pending','ready','deleted')),
 reserved_until timestamptz not null default now()+interval '125 minutes',
 created_at timestamptz not null default now()
);
create index lexisoar_recordings_owner on public.lexisoar_recordings(user_id);
alter table public.lexisoar_invites enable row level security;
alter table public.lexisoar_profiles enable row level security;
alter table public.lexisoar_workspaces enable row level security;
alter table public.lexisoar_recordings enable row level security;
revoke all on public.lexisoar_invites,public.lexisoar_profiles,public.lexisoar_workspaces,public.lexisoar_recordings from anon,authenticated;
grant all on public.lexisoar_invites,public.lexisoar_profiles,public.lexisoar_workspaces,public.lexisoar_recordings to service_role;
grant select on public.lexisoar_profiles,public.lexisoar_workspaces,public.lexisoar_recordings to authenticated;

-- This helper answers only whether the current verified identity is invited.
create function lexisoar_private.is_invited() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join public.lexisoar_invites i on i.email=lower(u.email)
 where u.id=(select auth.uid()) and u.email_confirmed_at is not null and i.enabled);
$$;
revoke all on function lexisoar_private.is_invited() from public,anon;
grant execute on function lexisoar_private.is_invited() to authenticated;
create policy own_profile on public.lexisoar_profiles for select to authenticated using(user_id=(select auth.uid()) and (select lexisoar_private.is_invited()));
create policy own_workspace on public.lexisoar_workspaces for select to authenticated using(user_id=(select auth.uid()) and (select lexisoar_private.is_invited()));
create policy own_recordings on public.lexisoar_recordings for select to authenticated using(user_id=(select auth.uid()) and status<>'deleted' and (select lexisoar_private.is_invited()));

-- Server-only atomic compare-and-swap prevents lost updates across function instances.
create function public.commit_lexisoar_workspace(p_user_id uuid,p_revision bigint,p_state jsonb,p_import_hash text default null)
returns bigint language plpgsql security invoker set search_path='' as $$
declare next_revision bigint;
begin
 if p_revision=-1 then
  insert into public.lexisoar_workspaces(user_id,revision,state,import_hash) values(p_user_id,0,p_state,p_import_hash)
  on conflict do nothing returning revision into next_revision;
 else
  update public.lexisoar_workspaces set state=p_state,revision=revision+1,import_hash=p_import_hash,updated_at=now()
  where user_id=p_user_id and revision=p_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'workspace_conflict'; end if;
 return next_revision;
end; $$;
revoke all on function public.commit_lexisoar_workspace(uuid,bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.commit_lexisoar_workspace(uuid,bigint,jsonb,text) to service_role;

create function public.reserve_lexisoar_recording(p_user_id uuid,p_id uuid,p_bytes bigint,p_mime text)
returns void language plpgsql security invoker set search_path='' as $$
declare existing public.lexisoar_recordings; used_bytes bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select * into existing from public.lexisoar_recordings where id=p_id;
 if found then
  if existing.user_id<>p_user_id or existing.bytes<>p_bytes or existing.mime<>p_mime or existing.status='deleted' then raise exception 'recording_identity_conflict'; end if;
  return;
 end if;
 -- Signed upload URLs last two hours. Reserve the maximum size during that window,
 -- even after deletion, to prevent outstanding URLs from evading the quota.
 select coalesce(sum(case when reserved_until>now() then 10000000 else bytes end),0) into used_bytes
 from public.lexisoar_recordings where user_id=p_user_id and (status<>'deleted' or reserved_until>now());
 if used_bytes+10000000>100000000 then raise exception 'audio_quota'; end if;
 insert into public.lexisoar_recordings(id,user_id,bytes,mime) values(p_id,p_user_id,p_bytes,p_mime);
end; $$;
revoke all on function public.reserve_lexisoar_recording(uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.reserve_lexisoar_recording(uuid,uuid,bigint,text) to service_role;

create function public.lexisoar_before_user_created(event jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if event->'user'->'app_metadata'->>'provider'<>'google' or not exists(select 1 from public.lexisoar_invites where email=lower(event->'user'->>'email') and enabled) then
  return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','This Google account is not invited to the LexiSoar beta.'));
 end if;
 return '{}'::jsonb;
end; $$;
revoke all on function public.lexisoar_before_user_created(jsonb) from public,anon,authenticated;
grant usage on schema public to supabase_auth_admin;
grant select on public.lexisoar_invites to supabase_auth_admin;
create policy auth_hook_invites on public.lexisoar_invites for select to supabase_auth_admin using(true);
grant execute on function public.lexisoar_before_user_created(jsonb) to supabase_auth_admin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('lexisoar-recordings','lexisoar-recordings',false,10000000,array['audio/webm','audio/ogg','audio/mp4']);
create policy lexisoar_audio_read on storage.objects for select to authenticated using(
 bucket_id='lexisoar-recordings' and (storage.foldername(name))[1]=(select auth.uid())::text
 and (select lexisoar_private.is_invited()) and exists(select 1 from public.lexisoar_recordings r where r.user_id=(select auth.uid()) and r.id::text=(storage.filename(name)) and r.status='ready')
);
-- Invite rows are populated separately; personal addresses are not committed to Git.
-- Automatic-RLS event trigger needs no client-facing EXECUTE privilege.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke all on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end $$;
