-- Retention promised in the KVKK notice (/kvkk, "Saklama süresi"):
-- reports and suggestions are detached from their author one year
-- after creation, notifications are deleted after one year and AI run
-- logs after 90 days. Runs nightly with pg_cron.
create extension if not exists pg_cron;

create or replace function private.apply_retention()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reports
     set reporter_id = null, is_anonymous = true
   where created_at < now() - interval '1 year' and reporter_id is not null;
  update public.suggestions
     set author_id = null, is_anonymous = true
   where created_at < now() - interval '1 year' and author_id is not null;
  delete from public.notifications where created_at < now() - interval '1 year';
  delete from public.ai_runs where created_at < now() - interval '90 days';
end;
$$;

revoke all on function private.apply_retention() from public, anon, authenticated;

select cron.unschedule('kvkk-retention') where exists (select 1 from cron.job where jobname = 'kvkk-retention');
select cron.schedule('kvkk-retention', '30 3 * * *', 'select private.apply_retention()');
