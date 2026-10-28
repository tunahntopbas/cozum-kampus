-- Auto-assignment: when a report reaches a unit ('yonlendirildi'), it goes straight to that unit's technician with the
-- fewest open jobs (ties: the one who got a job least recently), and its status becomes 'atandi'.
-- New reports are assigned once their 'olusturuldu' event is written, so the timeline reads created, then assigned;
-- hand-offs to another unit are assigned when the report row changes. An admin routing a report by hand through
-- admin_update_report keeps full control: the triggers stand down for that call.

create function private.auto_assign(rid bigint) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  rep public.reports%rowtype;
  pick uuid;
begin
  if coalesce(current_setting('app.manual_assign', true), '') = '1' then
    return;
  end if;
  select * into rep from public.reports where id = rid;
  if not found or rep.status <> 'yonlendirildi' or rep.unit_id is null then
    return;
  end if;
  -- A hand-off leaves the previous unit's technician behind; drop them.
  delete from public.assignments a
  where a.report_id = rid
    and not exists (select 1 from public.profiles p where p.id = a.staff_id and p.unit_id = rep.unit_id);
  if exists (select 1 from public.assignments where report_id = rid) then
    return;
  end if;

  select p.id into pick
  from public.profiles p
  left join public.assignments a on a.staff_id = p.id
  left join public.reports r on r.id = a.report_id and r.status in ('atandi', 'islemde', 'yeniden_acildi')
  where p.role = 'staff' and p.unit_id = rep.unit_id
  group by p.id
  order by count(r.id), max(a.assigned_at) nulls first, p.id
  limit 1;
  if pick is null then
    return;
  end if;

  insert into public.assignments (report_id, staff_id) values (rid, pick);
  update public.reports set status = 'atandi' where id = rid;
  insert into public.report_events (report_id, type, actor_id, payload)
  values (rid, 'durum', null, jsonb_build_object('to', 'atandi', 'auto', true));
end;
$$;
revoke execute on function private.auto_assign(bigint) from anon, authenticated, public;

create function private.auto_assign_on_created() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.type = 'olusturuldu' then
    perform private.auto_assign(new.report_id);
  end if;
  return null;
end;
$$;

create function private.auto_assign_on_route() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'yonlendirildi'
     and (old.status is distinct from new.status or old.unit_id is distinct from new.unit_id) then
    perform private.auto_assign(new.id);
  end if;
  return null;
end;
$$;
revoke execute on function private.auto_assign_on_created() from anon, authenticated, public;
revoke execute on function private.auto_assign_on_route() from anon, authenticated, public;

create trigger report_events_auto_assign after insert on public.report_events
  for each row execute function private.auto_assign_on_created();
create trigger reports_auto_assign after update of status, unit_id on public.reports
  for each row execute function private.auto_assign_on_route();

-- admin_update_report: same body as before, with the trigger switched off for the call.
create or replace function public.admin_update_report(
  rid bigint,
  to_unit bigint,
  to_urgency public.urgency,
  to_status public.report_status,
  to_staff uuid,
  note text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  cur public.reports%rowtype;
begin
  if private.auth_role() is distinct from 'admin' then
    raise exception 'Yalnızca yönetim' using errcode = '42501';
  end if;
  perform set_config('app.manual_assign', '1', true);
  select * into cur from public.reports where id = rid for update;
  if not found then
    perform set_config('app.manual_assign', '', true);
    return false;
  end if;
  if to_staff is not null and not exists (
    select 1 from public.profiles where id = to_staff and role = 'staff' and unit_id is not distinct from to_unit
  ) then
    raise exception 'Personel bu birimde değil' using errcode = '22023';
  end if;

  update public.reports
  set unit_id = to_unit,
      urgency = to_urgency,
      status = to_status,
      resolved_at = case
        when to_status = 'cozuldu' then coalesce(cur.resolved_at, now())
        else null
      end
  where id = rid;

  if cur.unit_id is distinct from to_unit then
    insert into public.report_events (report_id, type, actor_id, payload)
    values (rid, 'devredildi', auth.uid(), jsonb_build_object('from', cur.unit_id, 'to', to_unit, 'reason', 'Yönetim yönlendirdi'));
  end if;
  if cur.status is distinct from to_status then
    insert into public.report_events (report_id, type, actor_id, payload)
    values (rid, 'durum', auth.uid(), jsonb_build_object('to', to_status));
  end if;

  -- One technician per report.
  delete from public.assignments where report_id = rid and staff_id is distinct from to_staff;
  if to_staff is not null then
    insert into public.assignments (report_id, staff_id) values (rid, to_staff)
    on conflict (report_id, staff_id) do nothing;
  end if;

  if coalesce(trim(note), '') <> '' then
    insert into public.report_notes (report_id, author_id, body) values (rid, auth.uid(), trim(note));
  end if;
  perform set_config('app.manual_assign', '', true);
  return true;
end;
$$;
