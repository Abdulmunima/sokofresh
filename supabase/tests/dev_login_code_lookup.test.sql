-- The test-only code lookup refuses unless the project is flagged as dev.
begin;
-- test helpers must be callable after switching roles (0004 locks new functions by default)
alter default privileges grant execute on functions to public;
create function pg_temp.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;

insert into login_code_outbox (phone, code) values ('+254712000009', '271828');

do $$ begin
  perform set_config('role', 'anon', true);
  perform public.dev_latest_login_code('+254712000009');
  raise exception 'FAIL lookup worked without the dev flag';
exception when insufficient_privilege then raise notice 'ok  lookup is off unless the project is flagged as dev';
end $$;
select set_config('role', 'postgres', true);

insert into dev_flags (name) values ('login_code_lookup');
select set_config('role', 'anon', true);
select pg_temp.eq('dev project: tests can read the latest code', public.dev_latest_login_code('+254712000009'), '271828');
select pg_temp.eq('nothing for other numbers', public.dev_latest_login_code('+254700000000'), null::text);
select set_config('role', 'postgres', true);

select pg_temp.eq('the flag table is not readable through the API',
  has_table_privilege('anon', 'public.dev_flags', 'select'), false);
rollback;
