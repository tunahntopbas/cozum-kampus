-- Demo data. Building names and coordinates around Sakarya University Esentepe Campus are placeholders
-- (open item in docs/PROJE_REHBERI.md section 14). Reports are fictional.

insert into units (name, slug) values
  ('Yapı İşleri', 'yapi_isleri'),
  ('Bilgi İşlem', 'bilgi_islem'),
  ('Temizlik', 'temizlik'),
  ('Yemekhane', 'yemekhane'),
  ('Güvenlik', 'guvenlik')
on conflict (slug) do nothing;

insert into buildings (name, floors, location) values
  ('Mühendislik Fakültesi M1 Blok', 5, 'SRID=4326;POINT(30.3318 40.7419)'),
  ('Mühendislik Fakültesi M2 Blok', 5, 'SRID=4326;POINT(30.3326 40.7414)'),
  ('Fen Edebiyat Fakültesi', 4, 'SRID=4326;POINT(30.3341 40.7431)'),
  ('Merkez Kütüphane', 3, 'SRID=4326;POINT(30.3330 40.7426)'),
  ('Rektörlük', 4, 'SRID=4326;POINT(30.3352 40.7437)'),
  ('Merkez Yemekhane', 2, 'SRID=4326;POINT(30.3309 40.7433)'),
  ('İşletme Fakültesi', 5, 'SRID=4326;POINT(30.3361 40.7422)'),
  ('Kongre ve Kültür Merkezi', 2, 'SRID=4326;POINT(30.3299 40.7421)');

insert into places (building_id, floor, name, qr_code, location)
select b.id, p.floor, p.name, p.qr_code, b.location
from (values
  ('Mühendislik Fakültesi M1 Blok', 2, '2. kat erkek tuvaleti', 'M1-K2-WC'),
  ('Mühendislik Fakültesi M1 Blok', 0, 'Zemin kat asansör', 'M1-K0-ASN'),
  ('Mühendislik Fakültesi M2 Blok', 1, 'Bilgisayar laboratuvarı 104', 'M2-K1-LAB104'),
  ('Mühendislik Fakültesi M2 Blok', 3, '3. kat koridor', 'M2-K3-KOR'),
  ('Fen Edebiyat Fakültesi', 1, 'Amfi 1', 'FE-K1-AMFI1'),
  ('Fen Edebiyat Fakültesi', 2, '2. kat kadın tuvaleti', 'FE-K2-WC'),
  ('Merkez Kütüphane', 1, 'Okuma salonu', 'KUT-K1-OKUMA'),
  ('Merkez Kütüphane', 0, 'Giriş turnikeleri', 'KUT-K0-GIRIS'),
  ('Rektörlük', 0, 'Ana giriş rampası', 'REK-K0-RAMPA'),
  ('Rektörlük', 1, '1. kat toplantı salonu', 'REK-K1-TOPL'),
  ('Merkez Yemekhane', 0, 'Yemek salonu', 'YMK-K0-SALON'),
  ('Merkez Yemekhane', 0, 'Lavabolar', 'YMK-K0-LAVABO'),
  ('İşletme Fakültesi', 2, 'Derslik 205', 'ISL-K2-D205'),
  ('İşletme Fakültesi', 0, 'Kantin', 'ISL-K0-KANTIN'),
  ('Kongre ve Kültür Merkezi', 0, 'Fuaye', 'KKM-K0-FUAYE'),
  ('Kongre ve Kültür Merkezi', 0, 'Engelli asansörü', 'KKM-K0-ASN')
) as p(building, floor, name, qr_code)
join buildings b on b.name = p.building
on conflict (qr_code) do nothing;

insert into allowed_emails (email) values
  ('personel@demo.cozumkampus.app'),
  ('yonetim@demo.cozumkampus.app'),
  ('guvenlik@demo.cozumkampus.app')
on conflict do nothing;

insert into reports (title, description, category, urgency, status, unit_id, building_id, floor, location,
                     ai_summary, ai_confidence, ai_materials, vote_count, created_at, resolved_at)
select r.title, r.description, r.category, r.urgency::urgency, r.status::report_status, u.id, b.id, r.floor,
       b.location, r.summary, r.confidence, r.materials, r.votes,
       now() - (r.age_h || ' hours')::interval,
       case when r.status = 'cozuldu' then now() - ((r.age_h / 3) || ' hours')::interval end
from (values
  ('Koridor lambası yanmıyor', '3. kat koridorda tavan lambası iki gündür yanmıyor.', 'aydinlatma', 'orta', 'islemde', 'yapi_isleri', 'Mühendislik Fakültesi M2 Blok', 3, 'Tavandaki floresan armatür yanmıyor, koridor akşam karanlık kalıyor.', 0.94, array['LED tüp 18 W','starter'], 7, 30),
  ('Tuvalette musluk akıyor', 'Musluk kapanmıyor, sürekli su akıyor.', 'su_tesisat', 'orta', 'yonlendirildi', 'yapi_isleri', 'Mühendislik Fakültesi M1 Blok', 2, 'Lavabo bataryası tam kapanmıyor, su israfı var.', 0.91, array['batarya contası'], 4, 5),
  ('Kütüphanede Wi-Fi çekmiyor', 'Okuma salonunda eduroam sürekli kopuyor.', 'internet_ag', 'orta', 'atandi', 'bilgi_islem', 'Merkez Kütüphane', 1, 'Okuma salonunda kablosuz bağlantı sık kopuyor, erişim noktası kontrol edilmeli.', 0.88, array[]::text[], 23, 20),
  ('Asansör arızalı', 'Zemin kattaki asansör kapısı açılmıyor.', 'asansor_erisilebilirlik', 'acil', 'islemde', 'yapi_isleri', 'Mühendislik Fakültesi M1 Blok', 0, 'Asansör kapısı açılmıyor, engelli erişimi engelleniyor.', 0.9, array[]::text[], 12, 8),
  ('Kantin önünde çöp birikmiş', 'Çöp kutuları taşmış.', 'temizlik', 'dusuk', 'cozuldu', 'temizlik', 'İşletme Fakültesi', 0, 'Kantin önündeki çöp kutuları dolmuş, çevreye taşmış.', 0.95, array['çöp poşeti'], 3, 48),
  ('Amfide kalorifer yanmıyor', 'Ders sırasında amfi çok soğuk.', 'isitma_sogutma', 'orta', 'alindi', 'yapi_isleri', 'Fen Edebiyat Fakültesi', 1, 'Amfi 1 radyatörleri ısınmıyor.', 0.86, array[]::text[], 9, 2),
  ('Derslikte sıra kırık', 'Ön sıradaki masanın ayağı kırık.', 'mobilya', 'dusuk', 'yonlendirildi', 'yapi_isleri', 'İşletme Fakültesi', 2, 'Derslik 205 ön sırada masa ayağı kırılmış.', 0.9, array['vida seti'], 1, 26),
  ('Rampa korkuluğu gevşek', 'Rektörlük girişindeki rampanın korkuluğu sallanıyor.', 'asansor_erisilebilirlik', 'acil', 'atandi', 'yapi_isleri', 'Rektörlük', 0, 'Giriş rampası korkuluğu yerinden oynamış, düşme riski var.', 0.89, array['dübel','cıvata'], 5, 12),
  ('Yemekhanede lavabo tıkalı', 'Lavabolardan biri tıkanmış, su birikiyor.', 'su_tesisat', 'orta', 'cozuldu', 'yapi_isleri', 'Merkez Yemekhane', 0, 'Yemekhane lavabolarından biri tıkalı.', 0.92, array[]::text[], 6, 72),
  ('Laboratuvarda internet yok', 'Lab 104 bilgisayarlarında ağ bağlantısı yok.', 'internet_ag', 'acil', 'islemde', 'bilgi_islem', 'Mühendislik Fakültesi M2 Blok', 1, 'Laboratuvardaki kablolu ağ çalışmıyor, ders yapılamıyor.', 0.87, array['ağ anahtarı'], 15, 3),
  ('Fuayede ampul patlamış', 'Girişteki avizenin iki ampulü yanmıyor.', 'aydinlatma', 'dusuk', 'alindi', 'yapi_isleri', 'Kongre ve Kültür Merkezi', 0, 'Fuaye avizesinde iki ampul yanmıyor.', 0.9, array['E27 LED ampul'], 2, 1),
  ('Okuma salonu çok sıcak', 'Klima çalışmıyor, salon çok sıcak.', 'isitma_sogutma', 'orta', 'yeniden_acildi', 'yapi_isleri', 'Merkez Kütüphane', 1, 'Okuma salonu kliması soğutmuyor.', 0.84, array[]::text[], 11, 96)
) as r(title, description, category, urgency, status, unit_slug, building, floor, summary, confidence, materials, votes, age_h)
join units u on u.slug = r.unit_slug
join buildings b on b.name = r.building;

insert into report_events (report_id, type, payload, created_at)
select id, 'olusturuldu', jsonb_build_object('category', category, 'urgency', urgency, 'ai_pending', false), created_at
from reports;
