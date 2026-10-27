-- /yonetim/bildirimler: internal notes and one atomic admin update for routing, urgency, status and assignment.

-- Internal notes stay away from report_events, which the reporting student can read.
create table public.report_notes (
  id bigint generated always as identity primary key,
  report_id bigint not null references public.reports(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (length(trim(body)) between 1 and 1500),
  created_at timestamptz not null default now()
);
create index report_notes_report_idx on public.report_notes (report_id);
alter table public.report_notes enable row level security;

create policy "report notes read" on public.report_notes for select to authenticated
  using (
    private.auth_role() = 'admin'
    or (private.auth_role() = 'staff' and exists (
      select 1 from public.reports r where r.id = report_id and r.unit_id = private.auth_unit()
    ))
  );
-- Writes go through admin_update_report.

create function public.admin_update_report(
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
  select * into cur from public.reports where id = rid for update;
  if not found then
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
  return true;
end;
$$;
revoke execute on function public.admin_update_report(bigint, bigint, public.urgency, public.report_status, uuid, text) from anon, public;
grant execute on function public.admin_update_report(bigint, bigint, public.urgency, public.report_status, uuid, text) to authenticated;
