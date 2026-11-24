-- 0005 — Let automated tests read login codes on the DEVELOPMENT project only.
--
-- The dev project's send-code hook (0003) writes codes to login_code_outbox. End-to-end
-- tests log in for real and need that code. This function hands it out, but only if the
-- project has been explicitly marked as a dev project:
--
--     insert into public.dev_flags (name) values ('login_code_lookup');   -- dev project only!
--
-- Without that row (production, staging) the function refuses. Demo data only lives on dev.

create table public.dev_flags (
  name       text primary key,
  created_at timestamptz not null default now()
);
alter table public.dev_flags enable row level security;   -- no policies: not readable via the API
revoke all on table public.dev_flags from anon, authenticated;

create or replace function public.dev_latest_login_code(p_phone text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from dev_flags where name = 'login_code_lookup') then
    raise exception 'dev_latest_login_code is disabled on this project' using errcode = 'insufficient_privilege';
  end if;
  return (select code from login_code_outbox
           where phone = p_phone and created_at > now() - interval '10 minutes'
           order by id desc limit 1);
end $$;
revoke all on function public.dev_latest_login_code(text) from public;
grant execute on function public.dev_latest_login_code(text) to anon, authenticated;
