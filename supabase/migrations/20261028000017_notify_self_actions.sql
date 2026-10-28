-- An admin who also filed the report (single demo account) should still see its status changes.
create or replace function private.notify_report_event() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reports%rowtype;
  prefs jsonb;
  label text;
begin
  if new.type not in ('durum', 'devredildi') then
    return null;
  end if;
  select * into r from public.reports where id = new.report_id;
  if r.reporter_id is null then
    return null;
  end if;
  select types into prefs from public.notification_prefs where user_id = r.reporter_id;
  if coalesce(prefs -> 'muted_reports', '[]'::jsonb) @> to_jsonb(r.id) or prefs ->> 'durum' = 'false' then
    return null;
  end if;
  label := case
    when new.type = 'devredildi' then 'Bildirimin başka birime yönlendirildi'
    when new.payload ->> 'to' = 'yonlendirildi' then 'Bildirimin ilgili birime iletildi'
    when new.payload ->> 'to' = 'atandi' then 'Bildirimine teknisyen atandı'
    when new.payload ->> 'to' = 'islemde' then 'Bildirimin üzerinde çalışılıyor'
    when new.payload ->> 'to' = 'cozuldu' then 'Bildirimin çözüldü'
    when new.payload ->> 'to' = 'yeniden_acildi' then 'Bildirimin yeniden açıldı'
    else null
  end;
  if label is null then
    return null;
  end if;
  insert into public.notifications (user_id, type, title, body, payload)
  values (r.reporter_id, 'durum', label, r.title,
    jsonb_build_object('report_id', r.id, 'to', coalesce(new.payload ->> 'to', r.status::text)));
  return null;
end;
$$;
