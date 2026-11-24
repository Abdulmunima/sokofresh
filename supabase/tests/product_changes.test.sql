-- Stock/price edits: the newest change (by when it was made) wins, whatever order they arrive in.
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
\set cabbage '''5eed4000-0000-4000-8000-000000000004'''
\set staff '''5eed0000-0000-4000-8000-000000000003'''

select pg_temp.as_user(:staff);
select pg_temp.eq('a change is applied', public.set_product_price(:cabbage, 75, '2026-11-24 10:00:02+03'), 'applied');
select pg_temp.eq('a newer change wins', public.set_product_price(:cabbage, 60, '2026-11-24 10:00:05+03'), 'applied');
select pg_temp.eq('an older change arriving late is ignored',
  public.set_product_price(:cabbage, 80, '2026-11-24 10:00:01+03'), 'stale');
select pg_temp.eq('so the newest price stays', (select price_kes from products where id = :cabbage), 60.00::numeric);

select pg_temp.eq('stock: applied', public.set_product_stock(:cabbage, 'low', '2026-11-24 09:00:00+03'), 'applied');
select pg_temp.eq('stock: late old change ignored', public.set_product_stock(:cabbage, 'out', '2026-11-24 08:00:00+03'), 'stale');
select pg_temp.eq('stock stays low', (select stock_status::text from products where id = :cabbage), 'low');

-- Another business's product looks like it does not exist.
select pg_temp.as_user('d1000000-0000-4000-8000-0000000000aa');
select pg_temp.eq('outsiders cannot change it', public.set_product_price(:cabbage, 1, now()), 'not_found');
rollback;
