-- 0010 — The dev-only code lookup (0005) answers for DEMO numbers only.
--
-- On the dev project, anyone could call dev_latest_login_code for any number. That is fine
-- for demo numbers (fake accounts with demo data) but not for a real person who tries the
-- test site with their own phone. Demo numbers are +254712000000 to +254712000999.
-- The test site also uses this to show the code on screen for demo numbers.

create or replace function public.dev_latest_login_code(p_phone text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from dev_flags where name = 'login_code_lookup') then
    raise exception 'dev_latest_login_code is disabled on this project' using errcode = 'insufficient_privilege';
  end if;
  if p_phone !~ '^\+254712000[0-9]{3}$' then
    return null;   -- real numbers: never reveal their code
  end if;
  return (select code from login_code_outbox
           where phone = p_phone and created_at > now() - interval '10 minutes'
           order by id desc limit 1);
end $$;
