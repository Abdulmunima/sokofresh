-- Only the functions the app needs can be called through the API.
begin;
-- test helpers must be callable after switching roles (0004 locks new functions by default)
alter default privileges grant execute on functions to public;
create function pg_temp.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;

select pg_temp.eq('signed-out visitors cannot look up phone numbers',
  has_function_privilege('anon', 'public.verified_phone(uuid)', 'execute'), false);
select pg_temp.eq('signed-in users cannot look up phone numbers',
  has_function_privilege('authenticated', 'public.verified_phone(uuid)', 'execute'), false);
select pg_temp.eq('plan_limit is internal',
  has_function_privilege('authenticated', 'public.plan_limit(uuid, text)', 'execute'), false);
select pg_temp.eq('the order link catalogue is public',
  has_function_privilege('anon', 'public.get_public_catalog(text)', 'execute'), true);
select pg_temp.eq('signed-in users can claim invites',
  has_function_privilege('authenticated', 'public.claim_staff_invites()', 'execute'), true);
select pg_temp.eq('signed-out visitors cannot claim invites',
  has_function_privilege('anon', 'public.claim_staff_invites()', 'execute'), false);
select pg_temp.eq('RLS helpers work for every caller',
  has_function_privilege('anon', 'public.is_member(uuid)', 'execute'), true);

-- New functions are locked by default (undo this file's own test-helper grant first).
alter default privileges revoke execute on functions from public;
create function public.zz_new_function() returns int language sql as $$ select 1 $$;
select pg_temp.eq('new functions are not callable until granted',
  has_function_privilege('anon', 'public.zz_new_function()', 'execute'), false);

-- RLS still works for a signed-out visitor (empty result, not an error).
select set_config('role', 'anon', true);
select pg_temp.eq('signed-out visitors see no products', (select count(*) from public.products), 0::bigint);
select set_config('role', 'postgres', true);
rollback;
