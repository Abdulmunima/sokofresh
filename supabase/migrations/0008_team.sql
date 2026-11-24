-- 0008 — Staff management (PRD F1, task 1.3).
--
--  * Invites carry the person's name, which becomes their profile name when they first log in.
--  * team_members(): the people in a business with names and phones. Profiles are private to
--    each user, so this is how an owner sees who works for them (members of that business only).
--  * add_team_member(): owner adds someone by phone. If the number already has an account they
--    join straight away; otherwise an invite waits for their first login. Plan limits apply.

alter table public.staff_invites add column name text check (name is null or length(name) between 1 and 80);

-- Invites now also give the new member their name.
create or replace function public.claim_staff_invites()
returns int language plpgsql security definer set search_path = public as $$
declare v_phone text := public.verified_phone(auth.uid()); v_count int; v_name text;
begin
  if auth.uid() is null or v_phone is null then return 0; end if;
  select name into v_name from staff_invites where phone = v_phone and name is not null order by created_at limit 1;
  with claimed as (
    delete from staff_invites where phone = v_phone returning supplier_id, role
  )
  insert into memberships (supplier_id, user_id, role)
  select supplier_id, auth.uid(), role from claimed
  on conflict (supplier_id, user_id) do nothing;
  get diagnostics v_count = row_count;
  if v_name is not null then
    update profiles set full_name = v_name where id = auth.uid() and full_name is null;
  end if;
  return v_count;
end $$;

create or replace function public.team_members(p_supplier_id uuid)
returns table (user_id uuid, full_name text, phone text, role public.member_role, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.full_name, p.phone, m.role, m.created_at
    from memberships m
    left join profiles p on p.id = m.user_id
   where m.supplier_id = p_supplier_id
     and public.is_member(p_supplier_id)
   order by case m.role when 'owner' then 0 when 'manager' then 1 else 2 end, m.created_at;
$$;

create or replace function public.add_team_member(p_supplier_id uuid, p_phone text, p_role public.member_role, p_name text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_name text := nullif(btrim(p_name), '');
begin
  if not public.has_role(p_supplier_id, '{owner}') then
    raise exception 'only owners can add people' using errcode = 'insufficient_privilege';
  end if;
  if p_role = 'owner' then
    raise exception 'owners cannot be added this way' using errcode = 'check_violation';
  end if;
  if p_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'invalid_phone' using errcode = 'check_violation';
  end if;

  select id into v_user from profiles where phone = p_phone;
  if v_user is not null then
    if exists (select 1 from memberships where supplier_id = p_supplier_id and user_id = v_user) then
      return 'already_member';
    end if;
    insert into memberships (supplier_id, user_id, role) values (p_supplier_id, v_user, p_role);
    if v_name is not null then
      update profiles set full_name = v_name where id = v_user and full_name is null;
    end if;
    return 'added';
  end if;

  if exists (select 1 from staff_invites where supplier_id = p_supplier_id and phone = p_phone) then
    update staff_invites set role = p_role, name = coalesce(v_name, name)
     where supplier_id = p_supplier_id and phone = p_phone;
    return 'invited';
  end if;
  insert into staff_invites (supplier_id, phone, role, name) values (p_supplier_id, p_phone, p_role, v_name);
  return 'invited';
end $$;

revoke all on function public.team_members(uuid) from public, anon;
revoke all on function public.add_team_member(uuid, text, public.member_role, text) from public, anon;
grant execute on function public.team_members(uuid) to authenticated;
grant execute on function public.add_team_member(uuid, text, public.member_role, text) to authenticated;

-- Dev reset (0007) also takes the test number out of every team and invite list.
create or replace function public.dev_reset_test_user(p_phone text)
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if not exists (select 1 from dev_flags where name = 'login_code_lookup') then
    raise exception 'dev_reset_test_user is disabled on this project' using errcode = 'insufficient_privilege';
  end if;
  if p_phone !~ '^\+2547120001[0-9]{2}$' then
    raise exception 'only demo test numbers (+2547120001xx) can be reset' using errcode = 'check_violation';
  end if;
  delete from suppliers s
   where exists (select 1 from memberships m join profiles p on p.id = m.user_id
                  where m.supplier_id = s.id and m.role = 'owner' and p.phone = p_phone);
  get diagnostics v_count = row_count;
  delete from memberships m using profiles p where p.id = m.user_id and p.phone = p_phone and m.role <> 'owner';
  delete from staff_invites where phone = p_phone;
  update profiles set full_name = null where phone = p_phone;
  return v_count;
end $$;
