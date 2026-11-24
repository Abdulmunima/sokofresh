-- Demo data: "Mama Mboga Wholesale" — 3 staff, 15 products, 8 customers, 20 orders, payments.
-- Dates are relative to today so the demo always has new, recent and overdue orders.
-- Demo logins (test OTP 123456, see config.toml):
--   +254712000001 Wanjiku (owner) · +254712000002 Otieno (manager) · +254712000003 Achieng (staff)

-- ── People ─────────────────────────────────────────────────────────────
insert into auth.users (instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        phone_change, phone_change_token, email_change_token_current, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', phone, now(), now(), now(),
       '{"provider":"phone","providers":["phone"]}', '{}', '', '', '', '', '', '', '', ''
  from (values ('5eed0000-0000-4000-8000-000000000001'::uuid, '254712000001'),
               ('5eed0000-0000-4000-8000-000000000002'::uuid, '254712000002'),
               ('5eed0000-0000-4000-8000-000000000003'::uuid, '254712000003')) as u (id, phone);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, phone, 'phone',
       jsonb_build_object('sub', id::text, 'phone', phone, 'phone_verified', true), now(), now(), now()
  from auth.users where id::text like '5eed0000-%';

-- Profiles are created by the on_auth_user_created trigger; add names and languages.
update profiles set full_name = 'Wanjiku Kamau', language = 'sw' where id = '5eed0000-0000-4000-8000-000000000001';
update profiles set full_name = 'Otieno Ouma'                    where id = '5eed0000-0000-4000-8000-000000000002';
update profiles set full_name = 'Achieng Atieno', language = 'sw' where id = '5eed0000-0000-4000-8000-000000000003';

-- ── Supplier ───────────────────────────────────────────────────────────
insert into suppliers (id, name, slug, business_type, phone, default_language, default_payment_terms, default_credit_days)
values ('5eed1000-0000-4000-8000-000000000001', 'Mama Mboga Wholesale', 'mama-mboga-wholesale',
        'produce', '+254712000001', 'sw', 'on_delivery', 14);

insert into subscriptions (supplier_id, plan, status, trial_ends_at)
values ('5eed1000-0000-4000-8000-000000000001', 'growth', 'trialing', now() + interval '21 days');

insert into memberships (supplier_id, user_id, role) values
  ('5eed1000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', 'owner'),
  ('5eed1000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002', 'manager'),
  ('5eed1000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000003', 'staff');

insert into payment_methods (supplier_id, type, label, details, sort) values
  ('5eed1000-0000-4000-8000-000000000001', 'mpesa_till',    'Till 522533', '{"till_number":"522533"}', 1),
  ('5eed1000-0000-4000-8000-000000000001', 'mpesa_paybill', 'Paybill 247247', '{"paybill":"247247","account_format":"Your name"}', 2),
  ('5eed1000-0000-4000-8000-000000000001', 'cash',          'Cash on delivery', '{}', 3);

-- ── Delivery ───────────────────────────────────────────────────────────
insert into delivery_zones (id, supplier_id, name, fee_kes, min_order_kes) values
  ('5eed2000-0000-4000-8000-000000000001', '5eed1000-0000-4000-8000-000000000001', 'Westlands', 200, 2000),
  ('5eed2000-0000-4000-8000-000000000002', '5eed1000-0000-4000-8000-000000000001', 'CBD',         0, 1500),
  ('5eed2000-0000-4000-8000-000000000003', '5eed1000-0000-4000-8000-000000000001', 'Kilimani',  250, 2000);

-- Monday–Saturday 6–10am for every zone; order by 6pm the day before (12 hours).
insert into delivery_windows (supplier_id, weekday, start_time, end_time, cutoff_hours_before)
select '5eed1000-0000-4000-8000-000000000001', d, '06:00', '10:00', 12 from generate_series(1, 6) d;

-- ── Catalogue ──────────────────────────────────────────────────────────
insert into categories (id, supplier_id, name, name_sw, sort) values
  ('5eed3000-0000-4000-8000-000000000001', '5eed1000-0000-4000-8000-000000000001', 'Vegetables', 'Mboga',       1),
  ('5eed3000-0000-4000-8000-000000000002', '5eed1000-0000-4000-8000-000000000001', 'Fruit',      'Matunda',     2),
  ('5eed3000-0000-4000-8000-000000000003', '5eed1000-0000-4000-8000-000000000001', 'Dry goods',  'Vyakula vikavu', 3);

insert into products (id, supplier_id, category_id, name, name_sw, unit, price_kes, stock_status, sort)
select ('5eed4000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       '5eed1000-0000-4000-8000-000000000001',
       ('5eed3000-0000-4000-8000-00000000000' || cat)::uuid,
       name, name_sw, unit, price, status::stock_status, n
  from (values
    ( 1, 1, 'Tomatoes',        'Nyanya',         'crate', 3200, 'in_stock'),
    ( 2, 1, 'Red onions',      'Vitunguu',       'bag',   2800, 'in_stock'),
    ( 3, 1, 'Sukuma wiki',     'Sukuma wiki',    'bunch',   30, 'in_stock'),
    ( 4, 1, 'Cabbage',         'Kabichi',        'piece',   60, 'in_stock'),
    ( 5, 1, 'Carrots',         'Karoti',         'kg',      90, 'low'),
    ( 6, 1, 'Potatoes',        'Viazi',          'bag',   3500, 'in_stock'),
    ( 7, 1, 'Green peppers',   'Pilipili hoho',  'kg',     180, 'in_stock'),
    ( 8, 1, 'Spinach',         'Spinachi',       'bunch',   40, 'out'),
    ( 9, 2, 'Bananas',         'Ndizi',          'bunch',  450, 'in_stock'),
    (10, 2, 'Mangoes',         'Maembe',         'crate', 2500, 'low'),
    (11, 2, 'Avocados',        'Parachichi',     'piece',   25, 'in_stock'),
    (12, 2, 'Oranges',         'Machungwa',      'kg',     120, 'in_stock'),
    (13, 3, 'Maize flour 2kg', 'Unga wa mahindi 2kg', 'piece', 150, 'in_stock'),
    (14, 3, 'Rice 25kg',       'Mchele 25kg',    'bag',   3900, 'in_stock'),
    (15, 3, 'Beans',           'Maharagwe',      'kg',     160, 'in_stock')
  ) as p (n, cat, name, name_sw, unit, price, status);

-- ── Customers (terms set per customer) ─────────────────────────────────
insert into customers (id, supplier_id, name, phone, location, zone_id, payment_terms, credit_days, credit_limit_kes, notes, consent_at, whatsapp_opt_in)
select ('5eed5000-0000-4000-8000-00000000000' || n)::uuid, '5eed1000-0000-4000-8000-000000000001',
       name, phone, location, ('5eed2000-0000-4000-8000-00000000000' || zone)::uuid,
       terms::payment_terms, days, lim, notes, now() - interval '60 days', true
  from (values
    (1, 'Java House Westlands', '+254722100001', 'Sarit Centre',      1, 'credit',      30, 50000, 'Deliver to back door before 7am'),
    (2, 'Nyama Mama Restaurant','+254722100002', 'Delta Towers',      1, 'credit',      14, 30000, null),
    (3, 'Kilimani Grocers',     '+254722100003', 'Argwings Kodhek Rd',3, 'on_delivery', null, null, null),
    (4, 'Mama Njeri Kiosk',     '+254722100004', 'Kenyatta Market',   2, 'upfront',     null, null, 'Pays by M-Pesa before loading'),
    (5, 'Serena Hotel Kitchen', '+254722100005', 'Kenyatta Ave',      2, 'credit',      30, 150000, 'Invoice to Mr. Mwangi'),
    (6, 'Chef Wambui Catering', '+254722100006', 'Lavington',         3, 'credit',       7, 20000, null),
    (7, 'Highrise Butchery',    '+254722100007', 'Moi Avenue',        2, 'on_delivery', null, null, null),
    (8, 'Valley Arcade Shop',   '+254722100008', 'Valley Arcade',     3, 'on_delivery', null, null, null)
  ) as c (n, name, phone, location, zone, terms, days, lim, notes);

-- ── Orders: 20 over the last ~6 weeks ──────────────────────────────────
-- days_ago = when it was ordered; delivery is the next day. Newest orders are still moving.
insert into orders (id, supplier_id, customer_id, status, source, created_at, delivery_date, zone_id, delivery_fee_kes, created_by)
select ('5eed6000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
       '5eed1000-0000-4000-8000-000000000001',
       ('5eed5000-0000-4000-8000-00000000000' || cust)::uuid,
       status::order_status, source::order_source,
       (current_date - days_ago) + time '19:30' - interval '3 hours',   -- 7:30pm Nairobi, stored as UTC
       current_date - days_ago + 1,
       c.zone_id, coalesce(z.fee_kes, 0),
       case when source = 'link' then null else '5eed0000-0000-4000-8000-000000000003'::uuid end
  from (values
    ( 1, 5, 42, 'delivered', 'phone'),
    ( 2, 1, 40, 'delivered', 'whatsapp'),
    ( 3, 2, 35, 'delivered', 'phone'),
    ( 4, 6, 30, 'delivered', 'link'),
    ( 5, 5, 28, 'delivered', 'phone'),
    ( 6, 3, 25, 'delivered', 'walk_in'),
    ( 7, 1, 21, 'delivered', 'link'),
    ( 8, 2, 20, 'delivered', 'whatsapp'),
    ( 9, 7, 18, 'delivered', 'phone'),
    (10, 4, 14, 'delivered', 'walk_in'),
    (11, 6, 12, 'delivered', 'link'),
    (12, 5, 10, 'delivered', 'phone'),
    (13, 8,  8, 'cancelled', 'link'),
    (14, 1,  6, 'delivered', 'whatsapp'),
    (15, 3,  4, 'delivered', 'phone'),
    (16, 2,  3, 'out_for_delivery', 'link'),
    (17, 7,  1, 'packed',    'phone'),
    (18, 4,  1, 'confirmed', 'walk_in'),
    (19, 6,  0, 'new',       'link'),
    (20, 8,  0, 'new',       'whatsapp')
  ) as o (n, cust, days_ago, status, source)
  join customers c on c.id = ('5eed5000-0000-4000-8000-00000000000' || cust)::uuid
  left join delivery_zones z on z.id = c.zone_id
 order by n;   -- order numbers follow the date

update orders set cancel_reason = 'Customer closed for the day'
 where id = '5eed6000-0000-4000-8000-000000000013';

-- Items: each order gets 2–4 products, picked by a fixed pattern so the demo is repeatable.
insert into order_items (order_id, supplier_id, product_id, product_name, unit, unit_price_kes, qty_ordered)
select o.id, o.supplier_id, p.id, p.name, p.unit, p.price_kes,
       case p.unit when 'bunch' then 10 + (o.order_number * k) % 20
                   when 'piece' then 12 + (o.order_number * k) % 36
                   when 'kg'    then  5 + (o.order_number * k) % 15
                   else              1 + (o.order_number + k) % 3 end
  from orders o
  cross join generate_series(1, 4) k
  join products p on p.sort = 1 + (o.order_number * 7 + k * 4) % 15
 where o.supplier_id = '5eed1000-0000-4000-8000-000000000001'
   and k <= 2 + o.order_number % 3
   and p.sort <> 8;   -- spinach is out of stock

-- Order 9 was short-delivered: only part of the first line arrived.
update order_items set qty_delivered = qty_ordered - 1
 where id = (select id from order_items where order_id = '5eed6000-0000-4000-8000-000000000009' order by product_name limit 1);

-- ── Payments ───────────────────────────────────────────────────────────
-- Full payments for most delivered orders, a few part-payments, one split payment,
-- one payment on the cancelled order (shows as credit), and some left unpaid/overdue.
create temporary table seed_pay (n int, ord int, method payment_method_type, ref text, share numeric, days_after int);
insert into seed_pay values
  ( 1,  1, 'mpesa_till',    'SKA1B2C3D1', 1.0, 20),
  ( 2,  2, 'mpesa_paybill', 'SKA1B2C3D2', 1.0, 25),
  ( 3,  3, 'cash',          null,         1.0, 10),
  ( 4,  4, 'mpesa_till',    'SKA1B2C3D4', 0.5,  5),   -- part-paid, now overdue
  ( 5,  6, 'cash',          null,         1.0,  1),
  ( 6,  7, 'bank',          'FT26300012', 1.0, 18),
  ( 7,  9, 'mpesa_till',    'SKA1B2C3D7', 1.0,  1),
  ( 8, 10, 'mpesa_send_money','SKA1B2C3D8', 1.0, 0),
  (10, 13, 'mpesa_till',    'SKA1B2C3E0', 1.0,  0),   -- paid, then cancelled → credit
  (11, 15, 'cash',          null,         1.0,  1),
  (12, 18, 'mpesa_till',    'SKA1B2C3E2', 1.0,  0);   -- upfront kiosk

insert into payments (id, supplier_id, customer_id, amount_kes, method, reference, received_at, source, mpesa_transaction_id, created_by)
select ('5eed7000-0000-4000-8000-0000000000' || lpad(sp.n::text, 2, '0'))::uuid,
       o.supplier_id, o.customer_id, round(o.total_kes * sp.share), sp.method, sp.ref,
       o.created_at + make_interval(days => sp.days_after, hours => 2),
       case when sp.method::text like 'mpesa%' then 'sms_paste' else 'manual' end::payment_source,
       case when sp.method::text like 'mpesa%' then sp.ref end,
       '5eed0000-0000-4000-8000-000000000003'
  from seed_pay sp
  join orders o on o.id = ('5eed6000-0000-4000-8000-0000000000' || lpad(sp.ord::text, 2, '0'))::uuid;

insert into payment_allocations (supplier_id, payment_id, order_id, amount_kes)
select p.supplier_id, p.id, ('5eed6000-0000-4000-8000-0000000000' || lpad(sp.ord::text, 2, '0'))::uuid, p.amount_kes
  from seed_pay sp
  join payments p on p.id = ('5eed7000-0000-4000-8000-0000000000' || lpad(sp.n::text, 2, '0'))::uuid;

-- One M-Pesa payment from Serena covering two orders, oldest first:
-- order 5 in full, the rest towards order 12 (which stays part-paid).
insert into payments (id, supplier_id, customer_id, amount_kes, method, reference, received_at, source, mpesa_transaction_id, created_by)
select '5eed7000-0000-4000-8000-000000000020', '5eed1000-0000-4000-8000-000000000001',
       '5eed5000-0000-4000-8000-000000000005',
       o5.total_kes + round(o12.total_kes * 0.6), 'mpesa_paybill', 'SKA9SPLIT01',
       now() - interval '3 days', 'sms_paste', 'SKA9SPLIT01', '5eed0000-0000-4000-8000-000000000002'
  from orders o5, orders o12
 where o5.id = '5eed6000-0000-4000-8000-000000000005' and o12.id = '5eed6000-0000-4000-8000-000000000012';
insert into payment_allocations (supplier_id, payment_id, order_id, amount_kes)
select o.supplier_id, '5eed7000-0000-4000-8000-000000000020', o.id,
       case when o.id = '5eed6000-0000-4000-8000-000000000005' then o.total_kes else round(o.total_kes * 0.6) end
  from orders o where o.id in ('5eed6000-0000-4000-8000-000000000005', '5eed6000-0000-4000-8000-000000000012');

-- An M-Pesa payment from an unknown number, waiting in "To match".
insert into payments (id, supplier_id, customer_id, amount_kes, method, reference, payer_phone, received_at, source, mpesa_transaction_id, created_by)
values ('5eed7000-0000-4000-8000-000000000021', '5eed1000-0000-4000-8000-000000000001', null, 1500,
        'mpesa_till', 'SKA9UNKNWN', '+254733000111', now() - interval '5 hours', 'sms_paste', 'SKA9UNKNWN',
        '5eed0000-0000-4000-8000-000000000003');

-- Keep the order counter in step with the seeded orders.
update suppliers set order_counter = (select max(order_number) from orders where supplier_id = suppliers.id)
 where id = '5eed1000-0000-4000-8000-000000000001';

-- A pending invite, to show "waiting to log in" on the staff screen.
insert into staff_invites (supplier_id, phone, role)
values ('5eed1000-0000-4000-8000-000000000001', '+254712000004', 'staff');

drop table seed_pay;
