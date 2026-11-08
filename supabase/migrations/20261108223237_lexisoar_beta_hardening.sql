create or replace function public.lexisoar_before_user_created(event jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if (event->'user'->'app_metadata'->>'provider') is distinct from 'google' or not exists(select 1 from public.lexisoar_invites where email=lower(event->'user'->>'email') and enabled) then
  return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','This Google account is not invited to the LexiSoar beta.'));
 end if;
 return '{}'::jsonb;
end; $$;
revoke all on function public.lexisoar_before_user_created(jsonb) from public,anon,authenticated;
grant execute on function public.lexisoar_before_user_created(jsonb) to supabase_auth_admin;
