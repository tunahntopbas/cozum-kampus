-- /yonetim/birimler and /yonetim/kampus-sesi: material request handling, suggestion replies and demo suggestions.

-- Admin moves a material request along; "hazir" takes the quantity out of stock.
create function public.set_material_request_status(rid bigint, to_status text) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  req public.material_requests%rowtype;
begin
  if private.auth_role() is distinct from 'admin' then
    raise exception 'Yalnızca yönetim' using errcode = '42501';
  end if;
  select * into req from public.material_requests where id = rid for update;
  if not found or req.status in ('hazir', 'reddedildi') or to_status not in ('hazirlaniyor', 'hazir', 'reddedildi') then
    return false;
  end if;
  if to_status = 'hazir' then
    update public.inventory set qty = qty - req.qty where id = req.item_id and qty >= req.qty;
    if not found then
      raise exception 'Stok yetersiz' using errcode = '22023';
    end if;
  end if;
  update public.material_requests set status = to_status where id = rid;
  return true;
end;
$$;
revoke execute on function public.set_material_request_status(bigint, text) from anon, public;
grant execute on function public.set_material_request_status(bigint, text) to authenticated;

-- Admin publishes a public reply, sets the status and optionally notifies the author and voters.
create function public.publish_suggestion_reply(sid bigint, body text, to_status public.suggestion_status, notify boolean)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  sug public.suggestions%rowtype;
  notified integer := 0;
begin
  if private.auth_role() is distinct from 'admin' then
    raise exception 'Yalnızca yönetim' using errcode = '42501';
  end if;
  if coalesce(trim(body), '') = '' or length(body) > 2000 then
    raise exception 'Yanıt 1-2000 karakter olmalı' using errcode = '22023';
  end if;
  select * into sug from public.suggestions where id = sid for update;
  if not found then
    return -1;
  end if;
  insert into public.suggestion_replies (suggestion_id, admin_id, body, status_set)
  values (sid, auth.uid(), trim(body), to_status);
  update public.suggestions set status = to_status where id = sid;
  if notify then
    insert into public.notifications (user_id, type, title, body, payload)
    select u, 'oneri_yaniti', 'Önerine yanıt geldi', sug.title, jsonb_build_object('suggestion_id', sid, 'status', to_status)
    from (
      select user_id as u from public.suggestion_votes where suggestion_id = sid
      union
      select sug.author_id
    ) people
    where u is not null;
    get diagnostics notified = row_count;
  end if;
  return notified;
end;
$$;
revoke execute on function public.publish_suggestion_reply(bigint, text, public.suggestion_status, boolean) from anon, public;
grant execute on function public.publish_suggestion_reply(bigint, text, public.suggestion_status, boolean) to authenticated;

-- Keep suggestions.vote_count in step with votes (relative, so seeded counts survive).
create function private.sync_suggestion_votes() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.suggestions
  set vote_count = greatest(0, vote_count + case when tg_op = 'INSERT' then 1 else -1 end)
  where id = coalesce(new.suggestion_id, old.suggestion_id);
  return null;
end;
$$;
create trigger suggestion_votes_sync after insert or delete on public.suggestion_votes
  for each row execute function private.sync_suggestion_votes();

-- Demo suggestions from the demo student account (skipped when it does not exist).
insert into public.suggestions (author_id, is_anonymous, category, title, body, status, vote_count, created_at)
select p.id, true, d.category, d.title, d.body, d.status::public.suggestion_status, d.votes, d.created_at::timestamptz
from (values
  ('Yemekhane', 'Yemekhanede her gün vejetaryen seçenek olsun', 'Bazı günler etsiz ana yemek bulunmuyor.', 'yeni', 286, '2026-10-18T09:00:00+03:00'),
  ('Ulaşım', 'Ring seferleri akşam saatlerinde sıklaşsın', '18.00 sonrası seferler arası 40 dakikaya çıkıyor.', 'degerlendiriliyor', 241, '2026-10-09T09:00:00+03:00'),
  ('Ulaşım', 'Mühendislik Fakültesi önüne kapalı bisiklet park alanı', 'Yağmurda bisikletler ıslanıyor.', 'uygulandi', 138, '2026-10-02T09:00:00+03:00'),
  ('Akademik', 'Ders çalışma alanlarına daha fazla priz eklensin', 'Kütüphane ve kantinde priz çok az.', 'yeni', 97, '2026-10-26T09:00:00+03:00'),
  ('Yaşam', 'Yurt çamaşırhanesi 24 saat açık olsun', 'Ders saatleri yüzünden çamaşırhaneye yetişemiyoruz.', 'yeni', 64, '2026-10-21T09:00:00+03:00'),
  ('Kütüphane', 'Kütüphane final haftasında sabaha kadar açık kalsın', 'Final haftasında çalışacak yer bulmak zor.', 'planlandi', 412, '2026-10-12T09:00:00+03:00')
) as d(category, title, body, status, votes, created_at)
join public.profiles p on p.id = (select id from public.profiles where role = 'student' order by created_at limit 1)
where not exists (select 1 from public.suggestions);
