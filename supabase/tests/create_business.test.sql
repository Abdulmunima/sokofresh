-- Onboarding: create_business makes the supplier, owner membership and trial in one step.
begin;
-- test helpers must be callable after switching roles (0004 locks new functions by default)
alter default privileges grant execute on functions to public;
create function pg_temp.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;
create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid::text, true), set_config('role', 'authenticated', true);
$$;
create function pg_temp.as_admin() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claim.sub', '', true);
$$;

insert into auth.users (id, phone) values
  ('c1000000-0000-4000-8000-000000000001', '254712000101'),
  ('c1000000-0000-4000-8000-000000000002', '254712000102');

create temp table made (who int, id uuid);
grant all on made to public;
select pg_temp.as_user('c1000000-0000-4000-8000-000000000001');
insert into made select 1, public.create_business('Kamau Fresh Produce', 'kamau-fresh-produce', 'sw');
select pg_temp.as_admin();
select pg_temp.eq('a new business gets the requested link',
  (select slug from suppliers where id = (select id from made where who = 1)), 'kamau-fresh-produce');
select pg_temp.eq('the creator is its owner',
  (select role::text from memberships where user_id = 'c1000000-0000-4000-8000-000000000001'), 'owner');
select pg_temp.eq('it starts a Growth trial of about 30 days',
  (select plan::text || ':' || status::text || ':' || (round(extract(epoch from trial_ends_at - now()) / 86400))::text
     from subscriptions s join suppliers p on p.id = s.supplier_id where p.slug = 'kamau-fresh-produce'),
  'growth:trialing:30');
select pg_temp.eq('the business phone is the owner''s verified phone',
  (select phone from suppliers where slug = 'kamau-fresh-produce'), '+254712000101');

select pg_temp.as_user('c1000000-0000-4000-8000-000000000001');
do $$ begin
  perform public.create_business('Second Shop', 'second-shop');
  raise exception 'FAIL a second business was created';
exception when unique_violation then raise notice 'ok  one business per person';
end $$;

select pg_temp.as_user('c1000000-0000-4000-8000-000000000002');
insert into made select 2, public.create_business('Kamau Fresh Produce', 'kamau-fresh-produce');
select pg_temp.as_admin();
select pg_temp.eq('a taken link gets a number added',
  (select slug from suppliers where id = (select id from made where who = 2)), 'kamau-fresh-produce-2');

select pg_temp.as_admin();
do $$ begin
  perform set_config('role', 'anon', true);
  perform public.create_business('Ghost', 'ghost');
  raise exception 'FAIL signed-out visitor created a business';
exception when insufficient_privilege then raise notice 'ok  signed-out visitors cannot create businesses';
end $$;
select pg_temp.as_admin();

-- Dev reset refuses without the dev flag and for non-test numbers.
do $$ begin
  perform public.dev_reset_test_user('+254712000101');
  raise exception 'FAIL reset ran without the dev flag';
exception when insufficient_privilege then raise notice 'ok  reset is off unless the project is flagged as dev';
end $$;
insert into dev_flags (name) values ('login_code_lookup');
do $$ begin
  perform public.dev_reset_test_user('+254712000001');
  raise exception 'FAIL reset touched a non-test number';
exception when check_violation then raise notice 'ok  reset only touches +2547120001xx numbers';
end $$;
select pg_temp.eq('dev reset removes the test owner''s business', public.dev_reset_test_user('+254712000101'), 1);
select pg_temp.eq('and leaves others alone', (select count(*) from suppliers where slug = 'kamau-fresh-produce-2'), 1::bigint);
rollback;
