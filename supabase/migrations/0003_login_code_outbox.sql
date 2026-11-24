-- 0003 — Login codes for development without a WhatsApp sender.
--
-- In production, Supabase Auth's "Send SMS" hook calls our HTTPS endpoint
-- (src/app/api/auth/send-code/route.ts), which sends the code on WhatsApp.
--
-- A development project has no public URL for that endpoint, so it can point the hook at
-- this Postgres function instead. It writes the code to an outbox table that only
-- developers can read (Supabase dashboard → Table editor → login_code_outbox).
-- Demo numbers use fixed test codes and never reach the hook.
--
-- Enable: Dashboard → Authentication → Hooks → Send SMS → Postgres → public.send_login_code_dev
-- Never enable this on the production project.

create table public.login_code_outbox (
  id         bigint generated always as identity primary key,
  phone      text not null,
  code       text not null,
  created_at timestamptz not null default now()
);
alter table public.login_code_outbox enable row level security;   -- no policies: nobody reads it through the API
revoke all on table public.login_code_outbox from anon, authenticated;

create or replace function public.send_login_code_dev(event jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  insert into login_code_outbox (phone, code)
  values ('+' || ltrim(event -> 'user' ->> 'phone', '+'), event -> 'sms' ->> 'otp');
  -- keep only the last day of codes
  delete from login_code_outbox where created_at < now() - interval '1 day';
  return '{}'::jsonb;
end $$;

revoke all on function public.send_login_code_dev(jsonb) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.send_login_code_dev(jsonb) to supabase_auth_admin;
    grant usage on schema public to supabase_auth_admin;
  end if;
end $$;
