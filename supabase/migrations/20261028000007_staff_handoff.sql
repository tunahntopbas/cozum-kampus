-- "Devret": staff move a report to another unit. The reports update policy re-checks the new row, so staff cannot
-- set unit_id to a unit other than their own directly; this function does it for staff of the current unit or admin.

create function public.handoff_report(rid bigint, to_unit bigint, reason text) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  from_unit bigint;
begin
  if coalesce(trim(reason), '') = '' then
    raise exception 'Devir nedeni gerekli' using errcode = '22023';
  end if;
  select unit_id into from_unit from public.reports
  where id = rid and status not in ('cozuldu', 'geri_cekildi')
    and (private.auth_role() = 'admin' or (private.auth_role() = 'staff' and unit_id = private.auth_unit()));
  if not found or from_unit is not distinct from to_unit then
    return false;
  end if;
  update public.reports set unit_id = to_unit, status = 'yonlendirildi' where id = rid;
  insert into public.report_events (report_id, type, actor_id, payload)
  values (rid, 'devredildi', auth.uid(), jsonb_build_object('from', from_unit, 'to', to_unit, 'reason', trim(reason)));
  return true;
end;
$$;
revoke execute on function public.handoff_report(bigint, bigint, text) from anon, public;
grant execute on function public.handoff_report(bigint, bigint, text) to authenticated;
