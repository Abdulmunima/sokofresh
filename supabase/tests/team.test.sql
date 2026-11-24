-- Staff management: owners add people; teams are visible only to their own members.
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
\set sid '''5eed1000-0000-4000-8000-000000000001'''
\set owner '''5eed0000-0000-4000-8000-000000000001'''
\set staff '''5eed0000-0000-4000-8000-000000000003'''

-- Seed has 3 members + 1 invite; Growth allows 5 users, so make room for this test.
delete from staff_invites where supplier_id = :sid;

-- An existing account with no business yet.
insert into auth.users (id, phone) values ('d1000000-0000-4000-8000-000000000001', '254712000150');

select pg_temp.as_user(:owner);
select pg_temp.eq('the owner sees the whole team with names',
  (select count(*) from public.team_members(:sid) where full_name is not null), 3::bigint);
select pg_temp.eq('owners are listed first',
  (select role::text from public.team_members(:sid) limit 1), 'owner');
select pg_temp.eq('an existing account joins straight away',
  public.add_team_member(:sid, '+254712000150', 'manager', 'Njeri Wambui'), 'added');
select pg_temp.eq('a new number gets an invite',
  public.add_team_member(:sid, '+254712000151', 'staff', 'Baraka Otieno'), 'invited');
select pg_temp.eq('adding the same person again is harmless',
  public.add_team_member(:sid, '+254712000150', 'staff'), 'already_member');

select pg_temp.as_admin();
select pg_temp.eq('the existing account is now a manager with their name',
  (select m.role::text || ' ' || p.full_name from memberships m join profiles p on p.id = m.user_id
    where m.user_id = 'd1000000-0000-4000-8000-000000000001'), 'manager Njeri Wambui');

-- Plan limit: Growth allows 5 (now 4 members + 1 invite).
select pg_temp.as_user(:owner);
do $$ begin
  perform public.add_team_member('5eed1000-0000-4000-8000-000000000001', '+254712000152', 'staff');
  raise exception 'FAIL a sixth person was added on the Growth plan';
exception when check_violation then raise notice 'ok  plan limit stops a sixth person';
end $$;

-- Staff cannot add people, and other businesses cannot see this team.
select pg_temp.as_user(:staff);
do $$ begin
  perform public.add_team_member('5eed1000-0000-4000-8000-000000000001', '+254712000153', 'staff');
  raise exception 'FAIL staff added a person';
exception when insufficient_privilege then raise notice 'ok  staff cannot add people';
end $$;
select pg_temp.eq('staff can see who they work with',
  (select count(*) from public.team_members(:sid)) > 0, true);

select pg_temp.as_user('d1000000-0000-4000-8000-000000000099');
select pg_temp.eq('outsiders see nobody', (select count(*) from public.team_members(:sid)), 0::bigint);

-- The invited person logs in: they join, and get the name the owner typed.
select pg_temp.as_admin();
insert into auth.users (id, phone) values ('d1000000-0000-4000-8000-000000000002', '254712000151');
select pg_temp.as_user('d1000000-0000-4000-8000-000000000002');
select pg_temp.eq('the invite is claimed on first login', public.claim_staff_invites(), 1);
select pg_temp.as_admin();
select pg_temp.eq('and their profile gets the name from the invite',
  (select full_name from profiles where id = 'd1000000-0000-4000-8000-000000000002'), 'Baraka Otieno');
rollback;
