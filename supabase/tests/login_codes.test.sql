-- The development login-code hook writes codes where only developers can read them.
begin;
-- test helpers must be callable after switching roles (0004 locks new functions by default)
alter default privileges grant execute on functions to public;
create function pg_temp.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;

select pg_temp.eq('dev hook returns an empty object',
  public.send_login_code_dev('{"user": {"phone": "254712000009"}, "sms": {"otp": "481516"}}'::jsonb), '{}'::jsonb);
select pg_temp.eq('dev hook stores the code with an E.164 phone',
  (select code from login_code_outbox where phone = '+254712000009' order by id desc limit 1), '481516');

do $$ begin
  perform set_config('role', 'authenticated', true);
  perform count(*) from public.login_code_outbox;
  raise exception 'FAIL signed-in users can read login codes';
exception when insufficient_privilege then raise notice 'ok  signed-in users cannot read login codes';
end $$;
select set_config('role', 'postgres', true);

do $$ begin
  perform set_config('role', 'anon', true);
  perform public.send_login_code_dev('{"user": {"phone": "1"}, "sms": {"otp": "1"}}'::jsonb);
  raise exception 'FAIL anonymous users can call the dev hook';
exception when insufficient_privilege then raise notice 'ok  anonymous users cannot call the dev hook';
end $$;
rollback;
