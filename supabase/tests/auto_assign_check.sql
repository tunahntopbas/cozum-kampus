-- Auto-assignment check. Run via MCP execute_sql after migrations; it rolls back, so it changes nothing.
-- Raises an exception on the first failed expectation; a clean run returns 'ok'.
begin;

do $$
declare
  u bigint;
  a uuid;
  b uuid;
  r1 bigint;
  r2 bigint;
  r3 bigint;
  st public.report_status;
  who uuid;
begin
  -- A unit with at least two technicians.
  select unit_id into u from public.profiles where role = 'staff' and unit_id is not null
  group by unit_id having count(*) >= 2 order by unit_id limit 1;
  if u is null then
    raise exception 'no unit with two staff';
  end if;
  -- Start both technicians from an empty queue.
  delete from public.assignments where staff_id in (select id from public.profiles where role = 'staff' and unit_id = u);

  insert into public.reports (title, status, unit_id) values ('oto atama 1', 'yonlendirildi', u) returning id into r1;
  insert into public.report_events (report_id, type, payload) values (r1, 'olusturuldu', '{}');
  select status into st from public.reports where id = r1;
  select staff_id into a from public.assignments where report_id = r1;
  if st <> 'atandi' or a is null then
    raise exception 'r1 not auto-assigned: status %, staff %', st, a;
  end if;
  if not exists (select 1 from public.report_events where report_id = r1 and type = 'durum' and payload ->> 'to' = 'atandi') then
    raise exception 'r1 has no atandi event';
  end if;

  -- The second report goes to the other technician, who has fewer open jobs.
  insert into public.reports (title, status, unit_id) values ('oto atama 2', 'yonlendirildi', u) returning id into r2;
  insert into public.report_events (report_id, type, payload) values (r2, 'olusturuldu', '{}');
  select staff_id into b from public.assignments where report_id = r2;
  if b is null or b = a then
    raise exception 'r2 should go to the less loaded technician, got %', b;
  end if;

  -- A report that is still 'alindi' (no unit decided) is left alone.
  insert into public.reports (title, status) values ('oto atama 3', 'alindi') returning id into r3;
  insert into public.report_events (report_id, type, payload) values (r3, 'olusturuldu', '{}');
  if exists (select 1 from public.assignments where report_id = r3) then
    raise exception 'alindi report was assigned';
  end if;

  -- Admin picks a technician by hand: the trigger must not add or replace one.
  perform set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'admin' limit 1),
    'role', 'authenticated', 'app_metadata', json_build_object('role', 'admin'))::text, true);
  perform public.admin_update_report(r3, u, 'orta', 'yonlendirildi', null, null);
  select status into st from public.reports where id = r3;
  if st <> 'yonlendirildi' or exists (select 1 from public.assignments where report_id = r3) then
    raise exception 'admin routing without a technician was overridden: status %', st;
  end if;
end;
$$;

select 'ok' as auto_assign;
rollback;
