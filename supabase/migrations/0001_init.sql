-- SokoFresh (working name) — Phase 1 schema
-- Every business table carries supplier_id and is protected by row-level security.
-- SokoFresh records payments only; it never moves money.

-- ── Enums ──────────────────────────────────────────────────────────────
create type public.member_role         as enum ('owner', 'manager', 'staff');
create type public.stock_status        as enum ('in_stock', 'low', 'out');
create type public.payment_terms       as enum ('upfront', 'on_delivery', 'credit');
create type public.order_status        as enum ('new', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled');
create type public.order_source        as enum ('link', 'phone', 'whatsapp', 'walk_in');
create type public.order_payment_status as enum ('unpaid', 'part_paid', 'paid');  -- "overdue" is derived (see order_balances)
create type public.payment_method_type as enum ('cash', 'mpesa_till', 'mpesa_paybill', 'mpesa_send_money', 'bank');
create type public.payment_source      as enum ('manual', 'sms_paste', 'mpesa_auto');
create type public.plan_tier           as enum ('starter', 'growth', 'business');
create type public.subscription_status as enum ('trialing', 'active', 'grace', 'read_only', 'cancelled');
create type public.message_channel     as enum ('whatsapp_link', 'whatsapp_api', 'sms');

-- ── Suppliers, people, membership ──────────────────────────────────────
create table public.suppliers (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  business_type         text,
  phone                 text,
  default_language      text not null default 'en' check (default_language in ('en', 'sw')),
  default_payment_terms public.payment_terms not null default 'on_delivery',
  default_credit_days   int not null default 7 check (default_credit_days between 0 and 120),
  order_counter         int not null default 0,
  is_public             boolean not null default true,   -- customer link on/off
  created_at            timestamptz not null default now()
);

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  phone      text unique,
  full_name  text,
  language   text not null default 'en' check (language in ('en', 'sw')),
  created_at timestamptz not null default now()
);

create table public.memberships (
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.member_role not null default 'staff',
  created_at  timestamptz not null default now(),
  primary key (supplier_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

-- Staff invited by phone before they have an account; claimed on first login.
create table public.staff_invites (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  phone       text not null,
  role        public.member_role not null default 'staff',
  created_at  timestamptz not null default now(),
  unique (supplier_id, phone)
);

-- ── Payment methods the supplier accepts (shown to customers) ──────────
create table public.payment_methods (
  id                uuid primary key default gen_random_uuid(),
  supplier_id       uuid not null references public.suppliers (id) on delete cascade,
  type              public.payment_method_type not null,
  label             text,                          -- e.g. "Till 123456"
  details           jsonb not null default '{}',   -- till_number / paybill + account_format / phone / bank, account_name, account_number
  show_to_customers boolean not null default true,
  sort              int not null default 0,
  created_at        timestamptz not null default now()
);

-- ── Catalogue ──────────────────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  name        text not null,
  name_sw     text,
  sort        int not null default 0
);

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references public.suppliers (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  name         text not null,
  name_sw      text,
  unit         text not null default 'piece',     -- kg, crate, bag, piece, litre …
  price_kes    numeric(12,2) not null check (price_kes >= 0),
  stock_status public.stock_status not null default 'in_stock',
  qty          numeric(12,2),                     -- optional quantity tracking
  photo_path   text,
  is_active    boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index products_supplier_idx on public.products (supplier_id, is_active);

-- ── Delivery ───────────────────────────────────────────────────────────
create table public.delivery_zones (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid not null references public.suppliers (id) on delete cascade,
  name          text not null,
  fee_kes       numeric(12,2) not null default 0 check (fee_kes >= 0),
  min_order_kes numeric(12,2) not null default 0 check (min_order_kes >= 0)
);

create table public.delivery_windows (
  id                   uuid primary key default gen_random_uuid(),
  supplier_id          uuid not null references public.suppliers (id) on delete cascade,
  zone_id              uuid references public.delivery_zones (id) on delete cascade,  -- null = all zones
  weekday              smallint not null check (weekday between 0 and 6),             -- 0 = Sunday
  start_time           time not null,
  end_time             time not null check (end_time > start_time),
  cutoff_hours_before  int not null default 12 check (cutoff_hours_before >= 0)
);

-- ── Customers ──────────────────────────────────────────────────────────
create table public.customers (
  id               uuid primary key default gen_random_uuid(),
  supplier_id      uuid not null references public.suppliers (id) on delete cascade,
  name             text not null,
  phone            text,                           -- E.164
  location         text,
  zone_id          uuid references public.delivery_zones (id) on delete set null,
  notes            text,
  payment_terms    public.payment_terms not null default 'on_delivery',
  credit_days      int check (credit_days between 0 and 120),
  credit_limit_kes numeric(12,2) check (credit_limit_kes >= 0),
  whatsapp_opt_in  boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (supplier_id, phone)
);

-- ── Orders ─────────────────────────────────────────────────────────────
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  supplier_id        uuid not null references public.suppliers (id) on delete cascade,
  customer_id        uuid not null references public.customers (id) on delete restrict,
  order_number       int not null,                 -- per supplier, set by trigger
  status             public.order_status not null default 'new',
  source             public.order_source not null default 'phone',
  delivery_date      date,
  delivery_window_id uuid references public.delivery_windows (id) on delete set null,
  zone_id            uuid references public.delivery_zones (id) on delete set null,
  delivery_fee_kes   numeric(12,2) not null default 0 check (delivery_fee_kes >= 0),
  subtotal_kes       numeric(12,2) not null default 0 check (subtotal_kes >= 0),
  total_kes          numeric(12,2) not null default 0 check (total_kes >= 0),
  due_date           date,
  payment_status     public.order_payment_status not null default 'unpaid',
  notes              text,
  cancel_reason      text,
  created_by         uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (supplier_id, order_number)
);
create index orders_supplier_created_idx on public.orders (supplier_id, created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  supplier_id     uuid not null references public.suppliers (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  product_name    text not null,                   -- snapshot at order time
  unit            text not null,
  unit_price_kes  numeric(12,2) not null check (unit_price_kes >= 0),
  qty_ordered     numeric(12,2) not null check (qty_ordered > 0),
  qty_delivered   numeric(12,2) check (qty_delivered >= 0),  -- set when short-shipped
  line_total_kes  numeric(12,2) generated always as (unit_price_kes * coalesce(qty_delivered, qty_ordered)) stored
);
create index order_items_order_idx on public.order_items (order_id);

-- ── Payments (records only) ────────────────────────────────────────────
create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  supplier_id          uuid not null references public.suppliers (id) on delete cascade,
  customer_id          uuid references public.customers (id) on delete set null,  -- null = in "To match"
  amount_kes           numeric(12,2) not null check (amount_kes > 0),
  method               public.payment_method_type not null,
  reference            text,                       -- M-Pesa code / bank ref
  payer_phone          text,
  received_at          timestamptz not null default now(),
  source               public.payment_source not null default 'manual',
  mpesa_transaction_id text,
  raw                  jsonb,                      -- raw SMS text or Daraja callback
  created_by           uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now()
);
create unique index payments_mpesa_txn_uniq on public.payments (supplier_id, mpesa_transaction_id)
  where mpesa_transaction_id is not null;
create index payments_customer_idx on public.payments (customer_id);

create table public.payment_allocations (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  payment_id  uuid not null references public.payments (id) on delete cascade,
  order_id    uuid not null references public.orders (id) on delete cascade,
  amount_kes  numeric(12,2) not null check (amount_kes > 0),
  unique (payment_id, order_id)
);
create index payment_allocations_order_idx on public.payment_allocations (order_id);

-- ── Messaging, insights, subscription ──────────────────────────────────
create table public.message_log (
  id          uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  order_id    uuid references public.orders (id) on delete set null,
  kind        text not null,                       -- order_confirmed, statement, reminder …
  channel     public.message_channel not null,
  status      text not null default 'opened',      -- opened (share link) / sent / delivered / failed
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.customer_metrics (            -- recomputed nightly (F10, P1)
  customer_id         uuid primary key references public.customers (id) on delete cascade,
  supplier_id         uuid not null references public.suppliers (id) on delete cascade,
  order_count         int not null default 0,
  usual_gap_days      numeric(6,1),
  avg_order_value_kes numeric(12,2),
  last_order_at       timestamptz,
  flags               text[] not null default '{}',  -- overdue_to_order, shrinking, dropped_product, growing
  computed_at         timestamptz not null default now()
);

create table public.subscriptions (
  supplier_id   uuid primary key references public.suppliers (id) on delete cascade,
  plan          public.plan_tier not null default 'growth',
  status        public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz not null default now() + interval '30 days',
  renews_at     timestamptz,
  grace_until   timestamptz,
  updated_at    timestamptz not null default now()
);

-- SokoFresh's own subscription payments (STK push to our Paybill)
create table public.subscription_payments (
  id                   uuid primary key default gen_random_uuid(),
  supplier_id          uuid not null references public.suppliers (id) on delete cascade,
  amount_kes           numeric(12,2) not null check (amount_kes > 0),
  checkout_request_id  text unique,
  mpesa_receipt        text unique,
  status               text not null default 'pending',  -- pending / success / failed
  raw                  jsonb,
  created_at           timestamptz not null default now()
);

-- ── Helpers ────────────────────────────────────────────────────────────
create or replace function public.is_member(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.supplier_id = sid and m.user_id = auth.uid());
$$;

create or replace function public.has_role(sid uuid, roles public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.supplier_id = sid and m.user_id = auth.uid() and m.role = any (roles));
$$;

-- Per-supplier order numbers (1, 2, 3 …)
create or replace function public.set_order_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update suppliers set order_counter = order_counter + 1
   where id = new.supplier_id
  returning order_counter into new.order_number;
  return new;
end $$;
create trigger orders_set_number before insert on public.orders
  for each row execute function public.set_order_number();

-- Keep order totals in sync with items
create or replace function public.refresh_order_totals(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update orders o
     set subtotal_kes = coalesce((select sum(line_total_kes) from order_items i where i.order_id = o.id), 0),
         total_kes    = coalesce((select sum(line_total_kes) from order_items i where i.order_id = o.id), 0) + o.delivery_fee_kes,
         updated_at   = now()
   where o.id = p_order_id;
end $$;

create or replace function public.order_items_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform refresh_order_totals(coalesce(new.order_id, old.order_id));
  return null;
end $$;
create trigger order_items_totals after insert or update or delete on public.order_items
  for each row execute function public.order_items_changed();

-- Keep payment_status in sync with allocations and totals
create or replace function public.refresh_order_payment_status(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_paid numeric(12,2); v_total numeric(12,2);
begin
  select coalesce(sum(amount_kes), 0) into v_paid from payment_allocations where order_id = p_order_id;
  select total_kes into v_total from orders where id = p_order_id;
  update orders
     set payment_status = case when v_paid <= 0 then 'unpaid'
                               when v_paid >= v_total then 'paid'
                               else 'part_paid' end::public.order_payment_status
   where id = p_order_id;
end $$;

create or replace function public.allocations_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform refresh_order_payment_status(coalesce(new.order_id, old.order_id));
  if tg_op = 'UPDATE' and new.order_id is distinct from old.order_id then
    perform refresh_order_payment_status(old.order_id);
  end if;
  return null;
end $$;
create trigger payment_allocations_status after insert or update or delete on public.payment_allocations
  for each row execute function public.allocations_changed();

create or replace function public.orders_total_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.total_kes is distinct from old.total_kes then
    perform refresh_order_payment_status(new.id);
  end if;
  return null;
end $$;
create trigger orders_payment_status after update of total_kes on public.orders
  for each row execute function public.orders_total_changed();

-- ── Derived balances (source of truth for "who owes what") ─────────────
create view public.order_balances with (security_invoker = true) as
select o.id as order_id,
       o.supplier_id,
       o.customer_id,
       o.order_number,
       o.total_kes,
       o.due_date,
       coalesce(sum(pa.amount_kes), 0)               as paid_kes,
       o.total_kes - coalesce(sum(pa.amount_kes), 0) as outstanding_kes,
       (o.due_date is not null
        and o.due_date < (now() at time zone 'Africa/Nairobi')::date
        and o.total_kes - coalesce(sum(pa.amount_kes), 0) > 0) as is_overdue,
       greatest(0, (now() at time zone 'Africa/Nairobi')::date - o.due_date) as days_overdue
  from public.orders o
  left join public.payment_allocations pa on pa.order_id = o.id
 where o.status <> 'cancelled'
 group by o.id;

create view public.customer_balances with (security_invoker = true) as
select c.id as customer_id,
       c.supplier_id,
       c.name,
       c.credit_limit_kes,
       coalesce(sum(b.outstanding_kes), 0)                                              as outstanding_kes,
       coalesce(sum(b.outstanding_kes) filter (where b.is_overdue), 0)                  as overdue_kes,
       coalesce(sum(b.outstanding_kes) filter (where b.is_overdue and b.days_overdue <= 30), 0) as overdue_1_30_kes,
       coalesce(sum(b.outstanding_kes) filter (where b.days_overdue between 31 and 60), 0)     as overdue_31_60_kes,
       coalesce(sum(b.outstanding_kes) filter (where b.days_overdue > 60), 0)                  as overdue_60_plus_kes,
       (select coalesce(sum(p.amount_kes), 0) - coalesce(sum(pa.amount_kes), 0)
          from public.payments p
          left join public.payment_allocations pa on pa.payment_id = p.id
         where p.customer_id = c.id)                                                    as unallocated_credit_kes
  from public.customers c
  left join public.order_balances b on b.customer_id = c.id
 group by c.id;

-- ── Public catalogue for the customer order link (no login) ────────────
create or replace function public.get_public_catalog(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'supplier', jsonb_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'phone', s.phone),
    'products', coalesce((select jsonb_agg(jsonb_build_object(
                    'id', p.id, 'name', p.name, 'name_sw', p.name_sw, 'unit', p.unit,
                    'price_kes', p.price_kes, 'stock_status', p.stock_status,
                    'photo_path', p.photo_path, 'category', c.name) order by c.sort, p.sort, p.name)
                  from products p left join categories c on c.id = p.category_id
                 where p.supplier_id = s.id and p.is_active and p.stock_status <> 'out'), '[]'::jsonb),
    'payment_methods', coalesce((select jsonb_agg(jsonb_build_object(
                    'type', m.type, 'label', m.label, 'details', m.details) order by m.sort)
                  from payment_methods m
                 where m.supplier_id = s.id and m.show_to_customers), '[]'::jsonb),
    'delivery_zones', coalesce((select jsonb_agg(jsonb_build_object(
                    'id', z.id, 'name', z.name, 'fee_kes', z.fee_kes, 'min_order_kes', z.min_order_kes))
                  from delivery_zones z where z.supplier_id = s.id), '[]'::jsonb),
    'delivery_windows', coalesce((select jsonb_agg(jsonb_build_object(
                    'id', w.id, 'zone_id', w.zone_id, 'weekday', w.weekday, 'start_time', w.start_time,
                    'end_time', w.end_time, 'cutoff_hours_before', w.cutoff_hours_before))
                  from delivery_windows w where w.supplier_id = s.id), '[]'::jsonb)
  )
  from suppliers s
  left join subscriptions sub on sub.supplier_id = s.id
  where s.slug = p_slug
    and s.is_public
    and coalesce(sub.status, 'trialing') in ('trialing', 'active', 'grace');
$$;
revoke all on function public.get_public_catalog(text) from public;
grant execute on function public.get_public_catalog(text) to anon, authenticated;

-- ── Row-level security ─────────────────────────────────────────────────
alter table public.suppliers             enable row level security;
alter table public.profiles              enable row level security;
alter table public.memberships           enable row level security;
alter table public.staff_invites         enable row level security;
alter table public.payment_methods       enable row level security;
alter table public.categories            enable row level security;
alter table public.products              enable row level security;
alter table public.delivery_zones        enable row level security;
alter table public.delivery_windows      enable row level security;
alter table public.customers             enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.payments              enable row level security;
alter table public.payment_allocations   enable row level security;
alter table public.message_log           enable row level security;
alter table public.customer_metrics      enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.subscription_payments enable row level security;

-- Suppliers: members read; owner/manager edit. Creation happens in the onboarding server action (service role).
create policy suppliers_read   on public.suppliers for select using (public.is_member(id));
create policy suppliers_update on public.suppliers for update
  using (public.has_role(id, '{owner,manager}')) with check (public.has_role(id, '{owner,manager}'));

-- Profiles: each user manages their own
create policy profiles_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- Memberships and invites: members read; owners manage
create policy memberships_read   on public.memberships for select using (public.is_member(supplier_id));
create policy memberships_manage on public.memberships for all
  using (public.has_role(supplier_id, '{owner}')) with check (public.has_role(supplier_id, '{owner}'));
create policy invites_manage on public.staff_invites for all
  using (public.has_role(supplier_id, '{owner}')) with check (public.has_role(supplier_id, '{owner}'));

-- Day-to-day tables: any member of the supplier
do $$
declare t text;
begin
  foreach t in array array['categories','products','delivery_zones','delivery_windows','customers',
                           'orders','order_items','payments','payment_allocations','message_log']
  loop
    execute format('create policy %I on public.%I for all using (public.is_member(supplier_id)) with check (public.is_member(supplier_id))',
                   t || '_member', t);
  end loop;
end $$;

-- Settings and money-level tables: owner/manager write; members read where the UI needs it
create policy payment_methods_read  on public.payment_methods for select using (public.is_member(supplier_id));
create policy payment_methods_write on public.payment_methods for all
  using (public.has_role(supplier_id, '{owner,manager}')) with check (public.has_role(supplier_id, '{owner,manager}'));

create policy customer_metrics_read on public.customer_metrics for select
  using (public.has_role(supplier_id, '{owner,manager}'));

create policy subscriptions_read on public.subscriptions for select using (public.is_member(supplier_id));
create policy subscription_payments_read on public.subscription_payments for select
  using (public.has_role(supplier_id, '{owner}'));
-- subscriptions / subscription_payments / customer_metrics are written only by server code (service role).
