-- 0007 — DEVELOPMENT ONLY: let end-to-end tests start the onboarding wizard from scratch.
--
-- Deletes the business(es) owned by a demo test number (+2547120001xx only) so the wizard
-- test can create one again. Refuses unless the project is flagged as dev (see 0005).

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
  return v_count;
end $$;
revoke all on function public.dev_reset_test_user(text) from public;
grant execute on function public.dev_reset_test_user(text) to anon, authenticated;
