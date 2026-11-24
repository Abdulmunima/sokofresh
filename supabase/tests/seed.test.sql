-- Sanity checks on the demo data (runs after seed.sql in scripts/test-db.sh).
begin;
create function pg_temp.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;
create function pg_temp.ok(label text, cond boolean) returns void language sql as $$
  select pg_temp.eq(label, cond, true);
$$;
\set sid '''5eed1000-0000-4000-8000-000000000001'''
select pg_temp.eq('seed: 3 staff',        (select count(*) from memberships where supplier_id = :sid), 3::bigint);
select pg_temp.eq('seed: 15 products',    (select count(*) from products    where supplier_id = :sid), 15::bigint);
select pg_temp.eq('seed: 8 customers',    (select count(*) from customers   where supplier_id = :sid), 8::bigint);
select pg_temp.eq('seed: 20 orders',      (select count(*) from orders      where supplier_id = :sid), 20::bigint);
select pg_temp.ok('seed: every order has items',
  not exists (select 1 from orders o where not exists (select 1 from order_items i where i.order_id = o.id)));
select pg_temp.ok('seed: order numbers 1..20 and counter at 20',
  (select order_counter from suppliers where id = :sid) = 20
  and (select array_agg(order_number order by order_number) from orders where supplier_id = :sid) = (select array_agg(g) from generate_series(1, 20) g));
select pg_temp.ok('seed: has paid, part-paid and unpaid orders',
  (select count(distinct payment_status) from orders where supplier_id = :sid) = 3);
select pg_temp.ok('seed: some customers are overdue',
  (select count(*) from customer_balances where supplier_id = :sid and overdue_kes > 0) >= 2);
select pg_temp.ok('seed: some customers have credit',
  (select count(*) from customer_balances where supplier_id = :sid and credit_kes > 0) >= 1);
select pg_temp.ok('seed: a short-delivered line exists',
  exists (select 1 from order_items where supplier_id = :sid and qty_delivered is not null));
select pg_temp.eq('seed: one payment waiting in To match',
  (select count(*) from payments where supplier_id = :sid and customer_id is null), 1::bigint);
select pg_temp.ok('seed: order numbers follow order dates',
  (select bool_and(ok) from (select created_at >= lag(created_at) over (order by order_number) or lag(created_at) over (order by order_number) is null as ok
                               from orders where supplier_id = :sid) x));
select pg_temp.eq('seed: balance = orders − payments for every customer',
  (select count(*) from customer_balances where outstanding_kes - credit_kes <> orders_total_kes - payments_kes), 0::bigint);
select pg_temp.eq('seed: profiles created with verified phones',
  (select count(*) from profiles where phone like '+2547120000%'), 3::bigint);
select pg_temp.ok('seed: public link shows only in-stock and low items',
  (select jsonb_array_length(get_public_catalog('mama-mboga-wholesale') -> 'products')) = 14);
rollback;
