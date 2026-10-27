-- RLS smoke check. Run in the SQL editor (or via MCP execute_sql) after migrations and seed.
-- Runs inside a transaction and rolls back, so it changes nothing. Expected values are in the comments.
begin;

-- As a signed-in student who owns nothing.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select
  (select count(*) from units)                               as units,            -- 5
  (select count(*) from public_reports)                      as public_reports,   -- 12
  (select count(*) from reports)                             as raw_reports,      -- 0 (others' reports hidden)
  (select count(*) from security_reports)                    as security_reports, -- 0
  (select count(*) from ai_runs)                             as ai_runs,          -- 0 (service key only)
  (select count(*) from allowed_emails)                      as allowed_emails,   -- 0 (service key only)
  (select count(*) from report_events)                       as events;           -- 12 (public reports' timelines)

-- Anonymous visitors (QR link before login) see reference data but no reports.
set local role anon;
select
  (select count(*) from places) as places;                                        -- 16

rollback;
