-- One transaction: status + event + notification (report_events_notify trigger).
-- Intentionally no exception handler: event/notification failures roll back the update.
create function public.staff_update_report_status(
  rid bigint,
  expected_status public.report_status,
  to_status public.report_status,
  work_note text default null,
  ai_verdict jsonb default null,
  solution_path text default null
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reports%rowtype;
  latest_path text;
begin
  if auth.uid() is null or coalesce(private.auth_role()::text, '') not in ('staff', 'admin') then
    raise exception 'Staff or admin required' using errcode = '42501';
  end if;
  select * into r from public.reports where id = rid for update;
  if not found then return false; end if;
  if private.auth_role() <> 'admin' and (private.auth_unit() is null or r.unit_id is distinct from private.auth_unit()) then
    raise exception 'Report belongs to another unit' using errcode = '42501';
  end if;
  if r.status is distinct from expected_status then return false; end if;
  if not coalesce(
    (r.status in ('alindi', 'yonlendirildi', 'yeniden_acildi') and to_status = 'atandi')
    or (r.status = 'atandi' and to_status = 'islemde')
    or (r.status = 'islemde' and to_status = 'cozuldu'), false
  ) then
    raise exception 'Invalid staff status transition' using errcode = '22023';
  end if;
  if to_status = 'cozuldu' then
    select storage_path into latest_path from public.report_media
      where report_id = rid and kind = 'sonra' order by id desc limit 1;
    if latest_path is null then return false; end if;
    -- ai_verdict is untrusted browser input, never persisted as an authoritative AI result.
    -- Keep it in the RPC signature for compatibility; trusted verify persistence must be
    -- supplied by the service for this exact media row before an AI result can be recorded.
    -- Completion remains allowed without AI, as in the existing staff workflow.
    if (solution_path is not null and solution_path is distinct from latest_path)
      or (ai_verdict is not null and solution_path is distinct from latest_path) then
      return false;
    end if;
  end if;
  update public.reports set status = to_status,
    resolved_at = case when to_status = 'cozuldu' then now() else null end
    where id = rid;
  insert into public.report_events(report_id, type, actor_id, payload)
  values (rid, 'durum', auth.uid(),
    jsonb_build_object('from', r.status, 'to', to_status) ||
    case when to_status = 'cozuldu' then jsonb_build_object(
      'note', nullif(trim(work_note), ''), 'ai', null::jsonb, 'solution_path', latest_path
    ) else '{}'::jsonb end);
  return true;
end;
$$;
revoke execute on function public.staff_update_report_status(bigint, public.report_status, public.report_status, text, jsonb, text) from public, anon;
grant execute on function public.staff_update_report_status(bigint, public.report_status, public.report_status, text, jsonb, text) to authenticated;
