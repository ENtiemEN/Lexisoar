-- Renew the same pending recording reservation; never duplicate it on retry.
create or replace function public.reserve_lexisoar_recording(p_user_id uuid,p_id uuid,p_bytes bigint,p_mime text)
returns void language plpgsql security invoker set search_path='' as $$
declare existing public.lexisoar_recordings; used_bytes bigint;
begin
 if p_bytes<1 or p_bytes>10000000 or p_mime not in ('audio/webm','audio/ogg','audio/mp4') then raise exception 'invalid_recording'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select * into existing from public.lexisoar_recordings where id=p_id;
 if found then
  if existing.user_id<>p_user_id or existing.bytes<>p_bytes or existing.mime<>p_mime or existing.status='deleted' then raise exception 'recording_identity_conflict'; end if;
  if existing.status='ready' then return; end if;
 end if;
 -- Include outstanding signed URLs (also deleted files) at their maximum size.
 select coalesce(sum(case when reserved_until>now() then 10000000 else bytes end),0) into used_bytes
 from public.lexisoar_recordings where user_id=p_user_id and id<>p_id and (status<>'deleted' or reserved_until>now());
 if used_bytes+10000000>100000000 then raise exception 'audio_quota'; end if;
 if existing.id is not null then
  update public.lexisoar_recordings set reserved_until=now()+interval '125 minutes' where id=p_id and user_id=p_user_id;
 else
  insert into public.lexisoar_recordings(id,user_id,bytes,mime) values(p_id,p_user_id,p_bytes,p_mime);
 end if;
end; $$;
revoke all on function public.reserve_lexisoar_recording(uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.reserve_lexisoar_recording(uuid,uuid,bigint,text) to service_role;
