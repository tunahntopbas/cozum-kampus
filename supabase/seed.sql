-- Demo data. Buildings are real Esentepe Campus buildings from OpenStreetMap (the rest are added by
-- migration 20261027000004); floor counts are estimates. Reports are fictional.

insert into units (name, slug) values
  ('Yapı İşleri', 'yapi_isleri'),
  ('Bilgi İşlem', 'bilgi_islem'),
  ('Temizlik', 'temizlik'),
  ('Yemekhane', 'yemekhane'),
  ('Güvenlik', 'guvenlik')
on conflict (slug) do nothing;

insert into buildings (name, floors, location) values
  ('Mühendislik Fakültesi Dekanlığı', 4, 'SRID=4326;POINT(30.330555 40.742473)'),
  ('Mühendislik Fakültesi M2 Binası', 4, 'SRID=4326;POINT(30.331321 40.742182)'),
  ('Fen Edebiyat Fakültesi', 4, 'SRID=4326;POINT(30.328765 40.744688)'),
  ('Süleyman Demirel Kütüphanesi', 3, 'SRID=4326;POINT(30.332082 40.741665)'),
  ('Rektörlük Binası', 4, 'SRID=4326;POINT(30.332900 40.740939)'),
  ('Öğrenci Yemekhanesi', 2, 'SRID=4326;POINT(30.330407 40.744271)'),
  ('Hukuk Fakültesi', 4, 'SRID=4326;POINT(30.336668 40.740891)'),
  ('Kültür ve Kongre Merkezi', 2, 'SRID=4326;POINT(30.329331 40.741242)');

insert into places (building_id, floor, name, qr_code, location)
select b.id, p.floor, p.name, p.qr_code, b.location
from (values
  ('Mühendislik Fakültesi Dekanlığı', 2, '2. kat erkek tuvaleti', 'M1-K2-WC'),
  ('Mühendislik Fakültesi Dekanlığı', 0, 'Zemin kat asansör', 'M1-K0-ASN'),
  ('Mühendislik Fakültesi M2 Binası', 1, 'Bilgisayar laboratuvarı 104', 'M2-K1-LAB104'),
  ('Mühendislik Fakültesi M2 Binası', 3, '3. kat koridor', 'M2-K3-KOR'),
  ('Fen Edebiyat Fakültesi', 1, 'Amfi 1', 'FE-K1-AMFI1'),
  ('Fen Edebiyat Fakültesi', 2, '2. kat kadın tuvaleti', 'FE-K2-WC'),
  ('Süleyman Demirel Kütüphanesi', 1, 'Okuma salonu', 'KUT-K1-OKUMA'),
  ('Süleyman Demirel Kütüphanesi', 0, 'Giriş turnikeleri', 'KUT-K0-GIRIS'),
  ('Rektörlük Binası', 0, 'Ana giriş rampası', 'REK-K0-RAMPA'),
  ('Rektörlük Binası', 1, '1. kat toplantı salonu', 'REK-K1-TOPL'),
  ('Öğrenci Yemekhanesi', 0, 'Yemek salonu', 'YMK-K0-SALON'),
  ('Öğrenci Yemekhanesi', 0, 'Lavabolar', 'YMK-K0-LAVABO'),
  ('Hukuk Fakültesi', 2, 'Derslik 205', 'ISL-K2-D205'),
  ('Hukuk Fakültesi', 0, 'Kantin', 'ISL-K0-KANTIN'),
  ('Kültür ve Kongre Merkezi', 0, 'Fuaye', 'KKM-K0-FUAYE'),
  ('Kültür ve Kongre Merkezi', 0, 'Engelli asansörü', 'KKM-K0-ASN')
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
  ('Koridor lambası yanmıyor', '3. kat koridorda tavan lambası iki gündür yanmıyor.', 'aydinlatma', 'orta', 'islemde', 'yapi_isleri', 'Mühendislik Fakültesi M2 Binası', 3, 'Tavandaki floresan armatür yanmıyor, koridor akşam karanlık kalıyor.', 0.94, array['LED tüp 18 W','starter'], 7, 30),
  ('Tuvalette musluk akıyor', 'Musluk kapanmıyor, sürekli su akıyor.', 'su_tesisat', 'orta', 'yonlendirildi', 'yapi_isleri', 'Mühendislik Fakültesi Dekanlığı', 2, 'Lavabo bataryası tam kapanmıyor, su israfı var.', 0.91, array['batarya contası'], 4, 5),
  ('Kütüphanede Wi-Fi çekmiyor', 'Okuma salonunda eduroam sürekli kopuyor.', 'internet_ag', 'orta', 'atandi', 'bilgi_islem', 'Süleyman Demirel Kütüphanesi', 1, 'Okuma salonunda kablosuz bağlantı sık kopuyor, erişim noktası kontrol edilmeli.', 0.88, array[]::text[], 23, 20),
  ('Asansör arızalı', 'Zemin kattaki asansör kapısı açılmıyor.', 'asansor_erisilebilirlik', 'acil', 'islemde', 'yapi_isleri', 'Mühendislik Fakültesi Dekanlığı', 0, 'Asansör kapısı açılmıyor, engelli erişimi engelleniyor.', 0.9, array[]::text[], 12, 8),
  ('Kantin önünde çöp birikmiş', 'Çöp kutuları taşmış.', 'temizlik', 'dusuk', 'cozuldu', 'temizlik', 'Hukuk Fakültesi', 0, 'Kantin önündeki çöp kutuları dolmuş, çevreye taşmış.', 0.95, array['çöp poşeti'], 3, 48),
  ('Amfide kalorifer yanmıyor', 'Ders sırasında amfi çok soğuk.', 'isitma_sogutma', 'orta', 'alindi', 'yapi_isleri', 'Fen Edebiyat Fakültesi', 1, 'Amfi 1 radyatörleri ısınmıyor.', 0.86, array[]::text[], 9, 2),
  ('Derslikte sıra kırık', 'Ön sıradaki masanın ayağı kırık.', 'mobilya', 'dusuk', 'yonlendirildi', 'yapi_isleri', 'Hukuk Fakültesi', 2, 'Derslik 205 ön sırada masa ayağı kırılmış.', 0.9, array['vida seti'], 1, 26),
  ('Rampa korkuluğu gevşek', 'Rektörlük girişindeki rampanın korkuluğu sallanıyor.', 'asansor_erisilebilirlik', 'acil', 'atandi', 'yapi_isleri', 'Rektörlük Binası', 0, 'Giriş rampası korkuluğu yerinden oynamış, düşme riski var.', 0.89, array['dübel','cıvata'], 5, 12),
  ('Yemekhanede lavabo tıkalı', 'Lavabolardan biri tıkanmış, su birikiyor.', 'su_tesisat', 'orta', 'cozuldu', 'yapi_isleri', 'Öğrenci Yemekhanesi', 0, 'Yemekhane lavabolarından biri tıkalı.', 0.92, array[]::text[], 6, 72),
  ('Laboratuvarda internet yok', 'Lab 104 bilgisayarlarında ağ bağlantısı yok.', 'internet_ag', 'acil', 'islemde', 'bilgi_islem', 'Mühendislik Fakültesi M2 Binası', 1, 'Laboratuvardaki kablolu ağ çalışmıyor, ders yapılamıyor.', 0.87, array['ağ anahtarı'], 15, 3),
  ('Fuayede ampul patlamış', 'Girişteki avizenin iki ampulü yanmıyor.', 'aydinlatma', 'dusuk', 'alindi', 'yapi_isleri', 'Kültür ve Kongre Merkezi', 0, 'Fuaye avizesinde iki ampul yanmıyor.', 0.9, array['E27 LED ampul'], 2, 1),
  ('Okuma salonu çok sıcak', 'Klima çalışmıyor, salon çok sıcak.', 'isitma_sogutma', 'orta', 'yeniden_acildi', 'yapi_isleri', 'Süleyman Demirel Kütüphanesi', 1, 'Okuma salonu kliması soğutmuyor.', 0.84, array[]::text[], 11, 96)
) as r(title, description, category, urgency, status, unit_slug, building, floor, summary, confidence, materials, votes, age_h)
join units u on u.slug = r.unit_slug
join buildings b on b.name = r.building;

insert into report_events (report_id, type, payload, created_at)
select id, 'olusturuldu', jsonb_build_object('category', category, 'urgency', urgency, 'ai_pending', false), created_at
from reports;
