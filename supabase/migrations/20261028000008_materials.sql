-- /personel/malzeme uses the existing inventory and material_requests tables (guide section 8).
-- Adds a request note, sanity checks, one stock row per unit and item, and demo stock.

alter table inventory
  add constraint inventory_qty_check check (qty >= 0 and min_qty >= 0),
  add constraint inventory_unit_name_key unique (unit_id, name);

alter table material_requests
  add column note text check (length(note) <= 200),
  add constraint material_requests_qty_check check (qty between 1 and 999),
  add constraint material_requests_status_check
    check (status in ('onay_bekliyor', 'hazirlaniyor', 'hazir', 'reddedildi'));

-- Staff may only request items of their own unit's stock, and only as a new request.
drop policy "material requests staff insert" on material_requests;
create policy "material requests staff insert" on material_requests for insert to authenticated
  with check (
    requester_id = auth.uid() and status = 'onay_bekliyor'
    and exists (
      select 1 from public.inventory i
      where i.id = item_id and (private.auth_role() = 'admin' or i.unit_id = private.auth_unit())
    )
  );

insert into inventory (unit_id, name, qty, min_qty)
select u.id, m.name, m.qty, m.min_qty
from (values
  ('yapi_isleri', 'LED tüp 18 W', 12, 10),
  ('yapi_isleri', 'Starter', 6, 10),
  ('yapi_isleri', 'Su sızdırmazlık bandı', 3, 4),
  ('yapi_isleri', 'Batarya contası', 7, 5),
  ('yapi_isleri', 'Sıra bağlantı seti', 8, 4),
  ('yapi_isleri', 'Priz 16 A', 2, 6),
  ('yapi_isleri', 'Silikon tüpü', 9, 6),
  ('yapi_isleri', 'Kablo kanalı 2 m', 14, 8),
  ('yapi_isleri', 'Dübel ve cıvata seti', 20, 10),
  ('bilgi_islem', 'Cat6 patch kablo', 25, 15),
  ('bilgi_islem', 'Ağ anahtarı 8 port', 1, 2),
  ('temizlik', 'Çöp poşeti (rulo)', 40, 20)
) as m(slug, name, qty, min_qty)
join units u on u.slug = m.slug
on conflict (unit_id, name) do nothing;
