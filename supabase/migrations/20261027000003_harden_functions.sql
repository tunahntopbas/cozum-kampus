-- Security advisor follow-up.
-- 1. RLS helpers move to a schema PostgREST does not expose, so they are not callable as /rpc endpoints.
-- 2. The auth trigger function is not callable by API roles.
-- Intentionally kept: public.public_reports is a security definer view (it hides anonymous reporters while
-- the raw table stays private); ai_runs, allowed_emails and moderation_flags have RLS with no policies
-- (service key only).

create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.auth_role() set schema private;
alter function public.auth_unit() set schema private;
alter function public.can_read_report(bigint) set schema private;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Function bodies resolve names at run time, so the body that referenced public.* must be redefined.
create or replace function private.can_read_report(rid bigint) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.reports r
    where r.id = rid
      and (
        r.reporter_id = auth.uid()
        or private.auth_role() = 'admin'
        or (private.auth_role() = 'staff' and r.unit_id = private.auth_unit())
        or not r.is_hidden
      )
  )
$$;
