-- 0004 — Only expose the database functions the app actually calls.
--
-- Supabase publishes every function in `public` at /rest/v1/rpc/<name>, and Postgres lets
-- everyone execute new functions by default. The security advisor flagged that, e.g.,
-- verified_phone(user_id) could be called signed-out to read a user's phone number.
--
-- From now on: nothing is executable unless granted here (or in a later migration).

revoke execute on all functions in schema public from public, anon, authenticated;
-- PUBLIC's right to run new functions is a global default (it cannot be removed per schema);
-- Supabase additionally grants anon/authenticated per schema.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- Used inside row-level-security policies, so the querying role must be able to run them.
-- They only answer about the caller (auth.uid()), so they reveal nothing to anyone else.
grant execute on function public.is_member(uuid)                         to anon, authenticated;
grant execute on function public.has_role(uuid, public.member_role[])    to anon, authenticated;
grant execute on function public.can_edit_payment(uuid)                  to authenticated;

-- Called by the app.
grant execute on function public.get_public_catalog(text)  to anon, authenticated;  -- customer order link
grant execute on function public.claim_staff_invites()     to authenticated;        -- after login
grant execute on function public.anonymise_customer(uuid)  to authenticated;        -- owner/manager, checked inside

-- Everything else (trigger functions, verified_phone, plan_limit, can_manage_money,
-- refresh_* helpers, send_login_code_dev) runs only inside other functions or triggers.

-- Advisor: pin search_path on the two remaining trigger functions.
alter function public.touch_updated_at() set search_path = public;
alter function public.orders_set_total() set search_path = public;
