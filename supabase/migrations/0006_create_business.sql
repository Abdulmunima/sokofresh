-- 0006 — Onboarding: a signed-in person creates their business (PRD F1).
--
-- The app has no service-role key, so creating a supplier goes through this function:
-- it makes the supplier, the caller's owner membership and a 30-day trial in one step.
-- One business per person for now (a person who already belongs to one gets an error).

create or replace function public.create_business(p_name text, p_slug text, p_language text default 'en')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  v_name  text := btrim(p_name);
  v_base  text := lower(btrim(p_slug));
  v_slug  text;
  v_n     int  := 1;
  v_id    uuid;
begin
  if v_user is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from memberships where user_id = v_user) then
    raise exception 'already_has_business' using errcode = 'unique_violation';
  end if;
  if v_name is null or length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'invalid_name' using errcode = 'check_violation';
  end if;
  if v_base is null or v_base !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_base) > 50 then
    v_base := 'shop';
  end if;

  -- Order link: the name as given, else name-2, name-3 …
  v_slug := v_base;
  while exists (select 1 from suppliers where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into suppliers (name, slug, phone, default_language)
  values (v_name, v_slug, public.verified_phone(v_user),
          case when p_language in ('en', 'sw') then p_language else 'en' end)
  returning id into v_id;

  insert into memberships (supplier_id, user_id, role) values (v_id, v_user, 'owner');
  insert into subscriptions (supplier_id, plan, status, trial_ends_at)
  values (v_id, 'growth', 'trialing', now() + interval '30 days');   -- trial = full Growth plan

  return v_id;
end $$;

revoke all on function public.create_business(text, text, text) from public, anon;
grant execute on function public.create_business(text, text, text) to authenticated;
