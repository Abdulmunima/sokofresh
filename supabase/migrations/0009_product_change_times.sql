-- 0009 — "Last change wins" for stock and price edits, by when the change was MADE.
--
-- Changes are saved on the phone first and may reach the server late (offline, slow
-- network, a reload mid-send). Each change now carries the time it was made; the server
-- applies it only if it is newer than the change it already has. An old change arriving
-- late can no longer overwrite a newer one (e.g. a staff member's offline edit from
-- this morning vs. the owner's price update this afternoon).

alter table public.products
  add column price_changed_at timestamptz,
  add column stock_changed_at timestamptz;

create or replace function public.set_product_stock(p_product_id uuid, p_status public.stock_status, p_changed_at timestamptz)
returns text language plpgsql security invoker set search_path = public as $$
declare v_found boolean; v_applied boolean;
begin
  select true into v_found from products where id = p_product_id;   -- RLS: only my business
  if v_found is null then return 'not_found'; end if;
  update products set stock_status = p_status, stock_changed_at = p_changed_at
   where id = p_product_id
     and (stock_changed_at is null or stock_changed_at < p_changed_at)
  returning true into v_applied;
  return case when v_applied then 'applied' else 'stale' end;
end $$;

create or replace function public.set_product_price(p_product_id uuid, p_price numeric, p_changed_at timestamptz)
returns text language plpgsql security invoker set search_path = public as $$
declare v_found boolean; v_applied boolean;
begin
  if p_price is null or p_price < 0 or p_price > 10000000 then
    raise exception 'invalid_price' using errcode = 'check_violation';
  end if;
  select true into v_found from products where id = p_product_id;
  if v_found is null then return 'not_found'; end if;
  update products set price_kes = round(p_price, 2), price_changed_at = p_changed_at
   where id = p_product_id
     and (price_changed_at is null or price_changed_at < p_changed_at)
  returning true into v_applied;
  return case when v_applied then 'applied' else 'stale' end;
end $$;

-- security invoker: row-level security decides which products the caller may change.
grant execute on function public.set_product_stock(uuid, public.stock_status, timestamptz) to authenticated;
grant execute on function public.set_product_price(uuid, numeric, timestamptz) to authenticated;
