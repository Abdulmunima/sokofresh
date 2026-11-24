-- Regression tests for the review fixes in 0002. Runs inside one transaction and rolls back.
begin;
set constraints all immediate;

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

-- ── Fixture: suppliers A and B; owner A, staff A, owner B ──────────────
insert into auth.users (id, phone) values
  ('a0000000-0000-4000-8000-00000000000a', '254700000001'),
  ('a0000000-0000-4000-8000-00000000000c', '254700000003'),
  ('b0000000-0000-4000-8000-00000000000b', '254700000002');
insert into suppliers (id, name, slug, default_payment_terms, default_credit_days) values
  ('10000000-0000-4000-8000-000000000001', 'Test A', 'test-a', 'credit', 14),
  ('20000000-0000-4000-8000-000000000002', 'Test B', 'test-b', 'on_delivery', 7);
insert into subscriptions (supplier_id, plan) values
  ('10000000-0000-4000-8000-000000000001', 'growth'), ('20000000-0000-4000-8000-000000000002', 'starter');
insert into memberships values
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000a', 'owner'),
  ('10000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-00000000000c', 'staff'),
  ('20000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-00000000000b', 'owner');
insert into customers (id, supplier_id, name, phone, payment_terms, credit_days) values
  ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Hotel Alpha', '+254711000001', 'credit', 30),
  ('c0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Kiosk Beta',  '+254711000002', 'on_delivery', null);
insert into orders (id, supplier_id, customer_id, delivery_date) values
  ('d0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-02'),
  ('d0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', date '2026-11-03'),
  ('d0000000-0000-4000-8000-0000000000bb', '20000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', null);
insert into order_items (order_id, supplier_id, product_name, unit, unit_price_kes, qty_ordered) values
  ('d0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Tomatoes', 'crate', 60, 10),
  ('d0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Onions',   'bag',  400, 1),
  ('d0000000-0000-4000-8000-0000000000bb', '20000000-0000-4000-8000-000000000002', 'Beef',     'kg',   500, 2);

select pg_temp.eq('due date: credit 30 days from delivery date',
  (select due_date from orders where id = 'd0000000-0000-4000-8000-000000000001'), date '2026-12-02');

-- One KES 1,000 payment split 600 / 400
insert into payments (id, supplier_id, customer_id, amount_kes, method) values
  ('e0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 1000, 'cash');
insert into payment_allocations (supplier_id, payment_id, order_id, amount_kes) values
  ('10000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 600),
  ('10000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 400);

-- Bug 1
select pg_temp.eq('bug1: split payment leaves no credit',
  (select credit_kes from customer_balances where customer_id = 'c0000000-0000-4000-8000-000000000001'), 0.00::numeric(12,2));
select pg_temp.eq('bug1: split payment leaves nothing outstanding',
  (select outstanding_kes from customer_balances where customer_id = 'c0000000-0000-4000-8000-000000000001'), 0.00::numeric(12,2));

-- Bug 2
update orders set delivery_fee_kes = 200 where id = 'd0000000-0000-4000-8000-000000000002';
select pg_temp.eq('bug2: delivery fee updates total',
  (select total_kes from orders where id = 'd0000000-0000-4000-8000-000000000002'), 600.00::numeric(12,2));
select pg_temp.eq('bug2: and payment status drops to part-paid',
  (select payment_status::text from orders where id = 'd0000000-0000-4000-8000-000000000002'), 'part_paid');
update orders set delivery_fee_kes = 0 where id = 'd0000000-0000-4000-8000-000000000002';
select pg_temp.eq('bug2: removing the fee makes it paid again',
  (select payment_status::text from orders where id = 'd0000000-0000-4000-8000-000000000002'), 'paid');

-- Bug 3: 8 of 10 crates delivered after full payment
update order_items set qty_delivered = 8 where order_id = 'd0000000-0000-4000-8000-000000000001';
select pg_temp.eq('bug3: short delivery never gives negative outstanding',
  (select outstanding_kes from order_balances where order_id = 'd0000000-0000-4000-8000-000000000001'), 0.00::numeric(12,2));
select pg_temp.eq('bug3: excess 120 becomes customer credit',
  (select credit_kes from customer_balances where customer_id = 'c0000000-0000-4000-8000-000000000001'), 120.00::numeric(12,2));

-- Bug 4: cancel the 400 order that was paid
update orders set status = 'cancelled' where id = 'd0000000-0000-4000-8000-000000000002';
select pg_temp.eq('bug4: money paid on a cancelled order returns as credit',
  (select credit_kes from customer_balances where customer_id = 'c0000000-0000-4000-8000-000000000001'), 520.00::numeric(12,2));
update orders set status = 'delivered' where id = 'd0000000-0000-4000-8000-000000000002';
select pg_temp.eq('bug4: undo cancel restores it',
  (select credit_kes from customer_balances where customer_id = 'c0000000-0000-4000-8000-000000000001'), 120.00::numeric(12,2));

-- Invariant: outstanding - credit = orders - payments, for every customer
select pg_temp.eq('invariant: balance = orders - payments',
  (select count(*) from customer_balances where outstanding_kes - credit_kes <> orders_total_kes - payments_kes), 0::bigint);

-- Allocation cap
do $$ begin
  update payment_allocations set amount_kes = 401
   where payment_id = 'e0000000-0000-4000-8000-000000000001' and order_id = 'd0000000-0000-4000-8000-000000000002';
  raise exception 'FAIL allocation cap: over-allocation was accepted';
exception when check_violation then raise notice 'ok  allocations cannot exceed the payment';
end $$;

-- Bug 5: owner of A cannot touch B's order
do $$ begin
  perform pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
  insert into order_items (order_id, supplier_id, product_name, unit, unit_price_kes, qty_ordered) values
    ('d0000000-0000-4000-8000-0000000000bb', '10000000-0000-4000-8000-000000000001', 'Injected', 'kg', 99999, 1);
  raise exception 'FAIL bug5: cross-tenant order item accepted';
exception when foreign_key_violation then raise notice 'ok  bug5: cross-tenant order item rejected';
end $$;
select pg_temp.as_admin();
select pg_temp.eq('bug5: B''s order untouched',
  (select total_kes from orders where id = 'd0000000-0000-4000-8000-0000000000bb'), 1000.00::numeric(12,2));

-- Bug 6: staff limits
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000c');
delete from payments where id = 'e0000000-0000-4000-8000-000000000001';   -- RLS: silently 0 rows
select pg_temp.as_admin();
select pg_temp.eq('bug6: staff cannot delete someone else''s payment',
  (select count(*) from payments where id = 'e0000000-0000-4000-8000-000000000001'), 1::bigint);
do $$ begin
  perform pg_temp.as_user('a0000000-0000-4000-8000-00000000000c');
  update customers set credit_limit_kes = 1000000 where id = 'c0000000-0000-4000-8000-000000000001';
  raise exception 'FAIL bug6: staff changed a credit limit';
exception when insufficient_privilege then raise notice 'ok  bug6: staff cannot change credit terms';
end $$;
select pg_temp.as_admin();

-- Staff can record a payment and undo it within 10 minutes
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000c');
insert into payments (id, supplier_id, customer_id, amount_kes, method, created_by) values
  ('e0000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 50, 'mpesa_till', default);
delete from payments where id = 'e0000000-0000-4000-8000-000000000002';
select pg_temp.as_admin();
select pg_temp.eq('staff can undo their own recent payment',
  (select count(*) from payments where id = 'e0000000-0000-4000-8000-000000000002'), 0::bigint);

-- Staff-created customer gets supplier default terms, whatever they send
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000c');
insert into customers (id, supplier_id, name, payment_terms, credit_limit_kes) values
  ('c0000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Cafe Gamma', 'credit', 999999);
select pg_temp.as_admin();
select pg_temp.eq('staff-created customer has no credit limit',
  (select credit_limit_kes from customers where id = 'c0000000-0000-4000-8000-000000000003'), null::numeric);

-- Bug 7: profile phone comes from the verified auth phone
select pg_temp.as_user('a0000000-0000-4000-8000-00000000000a');
update profiles set phone = '+254799999999' where id = 'a0000000-0000-4000-8000-00000000000a';
select pg_temp.as_admin();
select pg_temp.eq('bug7: profile phone cannot be spoofed',
  (select phone from profiles where id = 'a0000000-0000-4000-8000-00000000000a'), '+254700000001');

-- Invite claiming uses the verified phone
insert into staff_invites (supplier_id, phone, role) values ('10000000-0000-4000-8000-000000000001', '+254700000002', 'manager');
select pg_temp.as_user('b0000000-0000-4000-8000-00000000000b');
select pg_temp.eq('invite claimed by the owner of that phone', public.claim_staff_invites(), 1);
select pg_temp.as_admin();
select pg_temp.eq('invite became a manager membership',
  (select role::text from memberships where supplier_id = '10000000-0000-4000-8000-000000000001' and user_id = 'b0000000-0000-4000-8000-00000000000b'), 'manager');

-- Last owner guard
do $$ begin
  delete from memberships where supplier_id = '20000000-0000-4000-8000-000000000002';
  raise exception 'FAIL last owner was removed';
exception when check_violation then raise notice 'ok  a business keeps at least one owner';
end $$;

-- Plan limits: Starter allows 1 user
do $$ begin
  insert into staff_invites (supplier_id, phone) values ('20000000-0000-4000-8000-000000000002', '+254722000000');
  raise exception 'FAIL starter plan accepted a second user';
exception when check_violation then raise notice 'ok  starter plan is limited to 1 user';
end $$;

-- Public catalogue still works and does not leak customers
select pg_temp.eq('public catalogue returns supplier',
  (select get_public_catalog('test-a') -> 'supplier' ->> 'name'), 'Test A');
select pg_temp.eq('public catalogue has no customer data',
  (select get_public_catalog('test-a')::text like '%Hotel Alpha%'), false);

rollback;
