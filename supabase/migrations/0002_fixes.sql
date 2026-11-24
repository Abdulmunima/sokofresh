-- 0002 — fixes from the schema review (Nov 2026)
--
--  1. customer credit was double-counted when one payment paid several orders
--  2. changing an order's delivery fee did not update its total
--  3. short delivery after payment produced negative balances
--  4. money paid against a cancelled order disappeared
--  5. a member of one supplier could attach rows to another supplier's orders
--  6. staff could delete payments/orders and change credit terms
--  7. users could set profiles.phone to any number (invite takeover)
--
-- Plus gaps: due dates set from customer terms, allocation caps, last-owner guard,
-- staff-invite claiming, plan limits, customer consent + anonymisation, products.updated_at.
--
-- Balance rule (tested in supabase/tests): for every customer
--   outstanding_kes - credit_kes  =  sum(total of non-cancelled orders) - sum(payments)

-- ════════════════════════════════════════════════════════════════════════
-- 5. Tenant-safe foreign keys: a child row must point at a parent with the same supplier_id
-- ════════════════════════════════════════════════════════════════════════
alter table public.categories       add constraint categories_supplier_id_id_key       unique (supplier_id, id);
alter table public.products         add constraint products_supplier_id_id_key         unique (supplier_id, id);
alter table public.delivery_zones   add constraint delivery_zones_supplier_id_id_key   unique (supplier_id, id);
alter table public.delivery_windows add constraint delivery_windows_supplier_id_id_key unique (supplier_id, id);
alter table public.customers        add constraint customers_supplier_id_id_key        unique (supplier_id, id);
alter table public.orders           add constraint orders_supplier_id_id_key           unique (supplier_id, id);
alter table public.payments         add constraint payments_supplier_id_id_key         unique (supplier_id, id);

alter table public.products drop constraint products_category_id_fkey,
  add constraint products_category_fkey foreign key (supplier_id, category_id)
      references public.categories (supplier_id, id) on delete set null (category_id);

alter table public.customers drop constraint customers_zone_id_fkey,
  add constraint customers_zone_fkey foreign key (supplier_id, zone_id)
      references public.delivery_zones (supplier_id, id) on delete set null (zone_id);

alter table public.delivery_windows drop constraint delivery_windows_zone_id_fkey,
  add constraint delivery_windows_zone_fkey foreign key (supplier_id, zone_id)
      references public.delivery_zones (supplier_id, id) on delete cascade;

alter table public.orders
  drop constraint orders_customer_id_fkey,
  drop constraint orders_zone_id_fkey,
  drop constraint orders_delivery_window_id_fkey,
  add constraint orders_customer_fkey foreign key (supplier_id, customer_id)
      references public.customers (supplier_id, id) on delete restrict,
  add constraint orders_zone_fkey foreign key (supplier_id, zone_id)
      references public.delivery_zones (supplier_id, id) on delete set null (zone_id),
  add constraint orders_delivery_window_fkey foreign key (supplier_id, delivery_window_id)
      references public.delivery_windows (supplier_id, id) on delete set null (delivery_window_id);

alter table public.order_items
  drop constraint order_items_order_id_fkey,
  drop constraint order_items_product_id_fkey,
  add constraint order_items_order_fkey foreign key (supplier_id, order_id)
      references public.orders (supplier_id, id) on delete cascade,
  add constraint order_items_product_fkey foreign key (supplier_id, product_id)
      references public.products (supplier_id, id) on delete set null (product_id);

alter table public.payments drop constraint payments_customer_id_fkey,
  add constraint payments_customer_fkey foreign key (supplier_id, customer_id)
      references public.customers (supplier_id, id) on delete set null (customer_id);

alter table public.payment_allocations
  drop constraint payment_allocations_payment_id_fkey,
  drop constraint payment_allocations_order_id_fkey,
  add constraint payment_allocations_payment_fkey foreign key (supplier_id, payment_id)
      references public.payments (supplier_id, id) on delete cascade,
  add constraint payment_allocations_order_fkey foreign key (supplier_id, order_id)
      references public.orders (supplier_id, id) on delete cascade;
create index payment_allocations_payment_idx on public.payment_allocations (payment_id);

alter table public.message_log
  drop constraint message_log_customer_id_fkey,
  drop constraint message_log_order_id_fkey,
  add constraint message_log_customer_fkey foreign key (supplier_id, customer_id)
      references public.customers (supplier_id, id) on delete set null (customer_id),
  add constraint message_log_order_fkey foreign key (supplier_id, order_id)
      references public.orders (supplier_id, id) on delete set null (order_id);

alter table public.customer_metrics drop constraint customer_metrics_customer_id_fkey,
  add constraint customer_metrics_customer_fkey foreign key (supplier_id, customer_id)
      references public.customers (supplier_id, id) on delete cascade;

-- ════════════════════════════════════════════════════════════════════════
-- 2. Order total = subtotal + delivery fee, always (computed before every write)
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.orders_set_total()
returns trigger language plpgsql as $$
begin
  new.total_kes  := new.subtotal_kes + new.delivery_fee_kes;
  new.updated_at := now();
  return new;
end $$;
create trigger orders_set_total before insert or update on public.orders
  for each row execute function public.orders_set_total();

-- Items only refresh the subtotal now; the trigger above derives the total.
create or replace function public.refresh_order_totals(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update orders o
     set subtotal_kes = coalesce((select sum(line_total_kes) from order_items i where i.order_id = o.id), 0)
   where o.id = p_order_id;
end $$;

-- Fire on any change of total (a BEFORE trigger changing total is not caught by "update of total_kes").
drop trigger orders_payment_status on public.orders;
create trigger orders_payment_status after update on public.orders
  for each row when (new.total_kes is distinct from old.total_kes)
  execute function public.orders_total_changed();

-- A zero-total order (everything short-delivered) counts as paid.
create or replace function public.refresh_order_payment_status(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_paid numeric(12,2); v_total numeric(12,2);
begin
  select coalesce(sum(amount_kes), 0) into v_paid from payment_allocations where order_id = p_order_id;
  select total_kes into v_total from orders where id = p_order_id;
  update orders
     set payment_status = case when v_paid >= v_total and (v_paid > 0 or v_total = 0) then 'paid'
                               when v_paid <= 0 then 'unpaid'
                               else 'part_paid' end::public.order_payment_status
   where id = p_order_id
     and payment_status is distinct from
         (case when v_paid >= v_total and (v_paid > 0 or v_total = 0) then 'paid'
               when v_paid <= 0 then 'unpaid'
               else 'part_paid' end)::public.order_payment_status;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1, 3, 4. Balances
--   paid_kes        = everything allocated to the order
--   applied_kes     = the part of it that the order can absorb (never above total)
--   outstanding_kes = still owed on the order (never negative)
--   overpaid_kes    = excess, which becomes customer credit
--   Cancelled orders absorb nothing, so money paid on them returns to credit.
-- ════════════════════════════════════════════════════════════════════════
drop view public.customer_balances;
drop view public.order_balances;

create view public.order_balances with (security_invoker = true) as
with alloc as (
  select order_id, sum(amount_kes) as paid_kes from public.payment_allocations group by order_id
), b as (
  select o.id as order_id, o.supplier_id, o.customer_id, o.order_number, o.status,
         o.created_at, o.delivery_date, o.total_kes, o.due_date,
         coalesce(a.paid_kes, 0)::numeric(12,2) as paid_kes
    from public.orders o
    left join alloc a on a.order_id = o.id
   where o.status <> 'cancelled'
)
select b.*,
       least(b.paid_kes, b.total_kes)::numeric(12,2)                   as applied_kes,
       greatest(b.total_kes - b.paid_kes, 0)::numeric(12,2)           as outstanding_kes,
       greatest(b.paid_kes - b.total_kes, 0)::numeric(12,2)           as overpaid_kes,
       (b.due_date is not null
        and b.due_date < (now() at time zone 'Africa/Nairobi')::date
        and b.total_kes > b.paid_kes)                                  as is_overdue,
       case when b.due_date is not null and b.total_kes > b.paid_kes
            then greatest(0, (now() at time zone 'Africa/Nairobi')::date - b.due_date)
            else 0 end                                                 as days_overdue
  from b;

create view public.customer_balances with (security_invoker = true) as
with ob as (
  select customer_id,
         sum(total_kes)                                                         as orders_total_kes,
         sum(applied_kes)                                                       as applied_kes,
         sum(outstanding_kes)                                                   as outstanding_kes,
         sum(outstanding_kes) filter (where is_overdue)                         as overdue_kes,
         sum(outstanding_kes) filter (where is_overdue and days_overdue <= 30)  as overdue_1_30_kes,
         sum(outstanding_kes) filter (where is_overdue and days_overdue between 31 and 60) as overdue_31_60_kes,
         sum(outstanding_kes) filter (where is_overdue and days_overdue > 60)   as overdue_60_plus_kes,
         min(due_date) filter (where is_overdue)                                as oldest_overdue_date
    from public.order_balances group by customer_id
), pay as (
  select customer_id, sum(amount_kes) as payments_kes
    from public.payments where customer_id is not null group by customer_id
)
select c.id as customer_id,
       c.supplier_id,
       c.name,
       c.phone,
       c.payment_terms,
       c.credit_limit_kes,
       coalesce(ob.orders_total_kes, 0)::numeric(12,2)                            as orders_total_kes,
       coalesce(pay.payments_kes, 0)::numeric(12,2)                               as payments_kes,
       coalesce(ob.outstanding_kes, 0)::numeric(12,2)                             as outstanding_kes,
       coalesce(ob.overdue_kes, 0)::numeric(12,2)                                 as overdue_kes,
       coalesce(ob.overdue_1_30_kes, 0)::numeric(12,2)                            as overdue_1_30_kes,
       coalesce(ob.overdue_31_60_kes, 0)::numeric(12,2)                           as overdue_31_60_kes,
       coalesce(ob.overdue_60_plus_kes, 0)::numeric(12,2)                         as overdue_60_plus_kes,
       ob.oldest_overdue_date,
       -- money received but not used up by any open order (unallocated, overpaid, or paid on a cancelled order)
       (coalesce(pay.payments_kes, 0) - coalesce(ob.applied_kes, 0))::numeric(12,2) as credit_kes,
       -- what the customer owes after using their credit (negative = we owe them)
       (coalesce(ob.orders_total_kes, 0) - coalesce(pay.payments_kes, 0))::numeric(12,2) as net_balance_kes
  from public.customers c
  left join ob  on ob.customer_id  = c.id
  left join pay on pay.customer_id = c.id;

-- One payment cannot be allocated for more than its amount.
create or replace function public.check_allocation_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_amount numeric(12,2); v_allocated numeric(12,2);
begin
  select amount_kes into v_amount from payments where id = new.payment_id for update;
  select coalesce(sum(amount_kes), 0) into v_allocated from payment_allocations where payment_id = new.payment_id;
  if v_allocated > v_amount then
    raise exception 'Allocations (%) exceed payment amount (%)', v_allocated, v_amount
      using errcode = 'check_violation';
  end if;
  return null;
end $$;
create constraint trigger payment_allocations_cap after insert or update on public.payment_allocations
  deferrable initially deferred
  for each row execute function public.check_allocation_total();

-- ════════════════════════════════════════════════════════════════════════
-- Due dates from customer terms (if the app did not set one)
--   upfront      → order day
--   on_delivery  → delivery day (or order day)
--   credit       → delivery day (or order day) + credit days (customer's, else supplier default)
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.orders_set_due_date()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_terms public.payment_terms; v_days int; v_base date;
begin
  if new.due_date is not null then return new; end if;
  select c.payment_terms, coalesce(c.credit_days, s.default_credit_days)
    into v_terms, v_days
    from customers c join suppliers s on s.id = c.supplier_id
   where c.id = new.customer_id;
  v_base := coalesce(new.delivery_date, (now() at time zone 'Africa/Nairobi')::date);
  new.due_date := case v_terms
                    when 'upfront'     then (coalesce(new.created_at, now()) at time zone 'Africa/Nairobi')::date
                    when 'on_delivery' then v_base
                    when 'credit'      then v_base + v_days
                  end;
  return new;
end $$;
create trigger orders_set_due_date before insert on public.orders
  for each row execute function public.orders_set_due_date();

-- New customers start on the supplier's default terms (the app may override for owners/managers).
create or replace function public.customers_default_terms()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_money(new.supplier_id) then
    select default_payment_terms, null, null
      into new.payment_terms, new.credit_days, new.credit_limit_kes
      from suppliers where id = new.supplier_id;
  end if;
  return new;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- 6. Role-aware policies
-- ════════════════════════════════════════════════════════════════════════
-- True for owner/manager, and for server code (service role / no JWT user).
create or replace function public.can_manage_money(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is null or public.has_role(sid, '{owner,manager}');
$$;

create trigger customers_default_terms before insert on public.customers
  for each row execute function public.customers_default_terms();

-- Staff can edit a customer's name/phone/location/notes but not their money terms.
create or replace function public.customers_guard_terms()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_money(new.supplier_id)
     and (new.payment_terms    is distinct from old.payment_terms
       or new.credit_days      is distinct from old.credit_days
       or new.credit_limit_kes is distinct from old.credit_limit_kes) then
    raise exception 'Only owners and managers can change payment terms' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;
create trigger customers_guard_terms before update on public.customers
  for each row execute function public.customers_guard_terms();

-- Replace the blanket "any member can do anything" policies.
do $$
declare t text;
begin
  foreach t in array array['categories','products','delivery_zones','delivery_windows','customers',
                           'orders','order_items','payments','payment_allocations','message_log']
  loop
    execute format('drop policy %I on public.%I', t || '_member', t);
  end loop;
end $$;

-- Read: any member
create policy categories_read          on public.categories          for select using (public.is_member(supplier_id));
create policy products_read            on public.products            for select using (public.is_member(supplier_id));
create policy delivery_zones_read      on public.delivery_zones      for select using (public.is_member(supplier_id));
create policy delivery_windows_read    on public.delivery_windows    for select using (public.is_member(supplier_id));
create policy customers_read           on public.customers           for select using (public.is_member(supplier_id));
create policy orders_read              on public.orders              for select using (public.is_member(supplier_id));
create policy order_items_read         on public.order_items         for select using (public.is_member(supplier_id));
create policy payments_read            on public.payments            for select using (public.is_member(supplier_id));
create policy payment_allocations_read on public.payment_allocations for select using (public.is_member(supplier_id));
create policy message_log_read         on public.message_log         for select using (public.is_member(supplier_id));

-- Stock: staff add and edit products/categories; owners/managers delete.
create policy categories_insert on public.categories for insert with check (public.is_member(supplier_id));
create policy categories_update on public.categories for update using (public.is_member(supplier_id)) with check (public.is_member(supplier_id));
create policy categories_delete on public.categories for delete using (public.has_role(supplier_id, '{owner,manager}'));
create policy products_insert   on public.products   for insert with check (public.is_member(supplier_id));
create policy products_update   on public.products   for update using (public.is_member(supplier_id)) with check (public.is_member(supplier_id));
create policy products_delete   on public.products   for delete using (public.has_role(supplier_id, '{owner,manager}'));

-- Delivery settings: owners/managers only.
create policy delivery_zones_write on public.delivery_zones for all
  using (public.has_role(supplier_id, '{owner,manager}')) with check (public.has_role(supplier_id, '{owner,manager}'));
create policy delivery_windows_write on public.delivery_windows for all
  using (public.has_role(supplier_id, '{owner,manager}')) with check (public.has_role(supplier_id, '{owner,manager}'));

-- Customers: staff add/edit (terms guarded by trigger); owners/managers delete.
create policy customers_insert on public.customers for insert with check (public.is_member(supplier_id));
create policy customers_update on public.customers for update using (public.is_member(supplier_id)) with check (public.is_member(supplier_id));
create policy customers_delete on public.customers for delete using (public.has_role(supplier_id, '{owner,manager}'));

-- Orders: staff create and edit (cancel = status change, which is undoable); owners/managers delete.
create policy orders_insert on public.orders for insert with check (public.is_member(supplier_id));
create policy orders_update on public.orders for update using (public.is_member(supplier_id)) with check (public.is_member(supplier_id));
create policy orders_delete on public.orders for delete using (public.has_role(supplier_id, '{owner,manager}'));
create policy order_items_write on public.order_items for all
  using (public.is_member(supplier_id)) with check (public.is_member(supplier_id));

-- Payments: staff record them. Changing or deleting one is for owners/managers,
-- except that staff can undo a payment they recorded in the last 10 minutes.
create policy payments_insert on public.payments for insert
  with check (public.is_member(supplier_id) and created_by = auth.uid());
create policy payments_update on public.payments for update
  using (public.has_role(supplier_id, '{owner,manager}')) with check (public.has_role(supplier_id, '{owner,manager}'));
create policy payments_delete on public.payments for delete
  using (public.has_role(supplier_id, '{owner,manager}')
         or (public.is_member(supplier_id) and created_by = auth.uid() and created_at > now() - interval '10 minutes'));

create or replace function public.can_edit_payment(p_payment_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from payments p
     where p.id = p_payment_id
       and (public.has_role(p.supplier_id, '{owner,manager}')
            or (public.is_member(p.supplier_id) and p.created_by = auth.uid()
                and p.created_at > now() - interval '10 minutes')));
$$;
create policy payment_allocations_insert on public.payment_allocations for insert
  with check (public.is_member(supplier_id) and public.can_edit_payment(payment_id));
create policy payment_allocations_update on public.payment_allocations for update
  using (public.can_edit_payment(payment_id)) with check (public.can_edit_payment(payment_id));
create policy payment_allocations_delete on public.payment_allocations for delete
  using (public.can_edit_payment(payment_id));

create policy message_log_insert on public.message_log for insert
  with check (public.is_member(supplier_id) and created_by = auth.uid());

-- Keep at least one owner per supplier.
create or replace function public.memberships_keep_owner()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_sid uuid := coalesce(old.supplier_id, new.supplier_id);
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from suppliers where id = v_sid)   -- supplier itself being deleted is fine
     and not exists (select 1 from memberships where supplier_id = v_sid and role = 'owner' and user_id <> old.user_id) then
    raise exception 'A business must keep at least one owner' using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
create trigger memberships_keep_owner before update or delete on public.memberships
  for each row execute function public.memberships_keep_owner();

-- ════════════════════════════════════════════════════════════════════════
-- 7. Profiles: phone always comes from the verified auth phone; invites claimed on that
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.verified_phone(p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  -- Supabase stores auth phones without the leading "+".
  select case when u.phone is null or u.phone = '' then null
              when u.phone like '+%' then u.phone
              else '+' || u.phone end
    from auth.users u where u.id = p_user;
$$;

create or replace function public.profiles_lock_phone()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.phone := public.verified_phone(new.id);
  return new;
end $$;
create trigger profiles_lock_phone before insert or update on public.profiles
  for each row execute function public.profiles_lock_phone();

-- Create a profile automatically for each new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Called by the app after login: turns pending invites for my verified phone into memberships.
create or replace function public.claim_staff_invites()
returns int language plpgsql security definer set search_path = public as $$
declare v_phone text := public.verified_phone(auth.uid()); v_count int;
begin
  if auth.uid() is null or v_phone is null then return 0; end if;
  with claimed as (
    delete from staff_invites where phone = v_phone returning supplier_id, role
  )
  insert into memberships (supplier_id, user_id, role)
  select supplier_id, auth.uid(), role from claimed
  on conflict (supplier_id, user_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.claim_staff_invites() from public;
grant execute on function public.claim_staff_invites() to authenticated;

-- Members can see invites (to show "waiting to log in"); owners manage them (policy in 0001).
create policy invites_read on public.staff_invites for select using (public.is_member(supplier_id));
alter table public.staff_invites add constraint staff_invites_phone_e164 check (phone ~ '^\+[1-9][0-9]{7,14}$');

-- ════════════════════════════════════════════════════════════════════════
-- Plan limits (trial = Growth). Starter: 1 user, 100 products. Growth: 5 users. Business: unlimited.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.plan_limit(sid uuid, what text)
returns int language sql stable security definer set search_path = public as $$
  select case coalesce((select plan from subscriptions where supplier_id = sid), 'growth')
           when 'starter'  then case what when 'users' then 1 when 'products' then 100 end
           when 'growth'   then case what when 'users' then 5 end
           else null end;
$$;

create or replace function public.enforce_user_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_limit int := public.plan_limit(new.supplier_id, 'users'); v_used int;
begin
  if v_limit is null then return new; end if;
  select (select count(*) from memberships where supplier_id = new.supplier_id)
       + (select count(*) from staff_invites where supplier_id = new.supplier_id)
    into v_used;
  if v_used >= v_limit then
    raise exception 'plan_limit_users' using errcode = 'check_violation',
      hint = format('Your plan allows %s user(s). Upgrade to add more.', v_limit);
  end if;
  return new;
end $$;
create trigger staff_invites_limit before insert on public.staff_invites
  for each row execute function public.enforce_user_limit();
create trigger memberships_limit before insert on public.memberships
  for each row when (new.role <> 'owner')
  execute function public.enforce_user_limit();

create or replace function public.enforce_product_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_limit int := public.plan_limit(new.supplier_id, 'products');
begin
  if v_limit is not null
     and (select count(*) from products where supplier_id = new.supplier_id and is_active) >= v_limit then
    raise exception 'plan_limit_products' using errcode = 'check_violation',
      hint = format('Your plan allows %s products. Upgrade to add more.', v_limit);
  end if;
  return new;
end $$;
create trigger products_limit before insert on public.products
  for each row when (new.is_active) execute function public.enforce_product_limit();

-- Annual billing (12 months for the price of 10)
create type public.billing_period as enum ('monthly', 'annual');
alter table public.subscriptions add column billing_period public.billing_period not null default 'monthly';

-- ════════════════════════════════════════════════════════════════════════
-- Data protection: consent from the order page; anonymise instead of delete
-- ════════════════════════════════════════════════════════════════════════
alter table public.customers
  add column consent_at    timestamptz,
  add column anonymised_at timestamptz;
alter table public.customers add constraint customers_phone_e164 check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');

create or replace function public.anonymise_customer(p_customer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_sid uuid;
begin
  select supplier_id into v_sid from customers where id = p_customer_id;
  if v_sid is null or not public.has_role(v_sid, '{owner,manager}') then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  update customers
     set name = 'Deleted customer', phone = null, location = null, notes = null,
         whatsapp_opt_in = false, anonymised_at = now()
   where id = p_customer_id;
  update payments set payer_phone = null, raw = null where customer_id = p_customer_id;
end $$;
revoke all on function public.anonymise_customer(uuid) from public;
grant execute on function public.anonymise_customer(uuid) to authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- Housekeeping
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Internal trigger/helper functions should not be callable through the API.
revoke execute on function public.refresh_order_totals(uuid)          from public, anon, authenticated;
revoke execute on function public.refresh_order_payment_status(uuid)  from public, anon, authenticated;

-- Record who did it, without the app having to pass it.
alter table public.orders      alter column created_by set default auth.uid();
alter table public.payments    alter column created_by set default auth.uid();
alter table public.message_log alter column created_by set default auth.uid();
