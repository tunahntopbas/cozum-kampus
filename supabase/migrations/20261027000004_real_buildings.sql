-- Real Esentepe Campus buildings from OpenStreetMap (named buildings only; centroid of each footprint).
-- The eight placeholder rows are renamed in place so existing places and reports keep their foreign keys.
-- Floor counts are estimates until the campus confirms them. Unnamed OSM buildings are matched later.

update buildings b set name = v.name, floors = v.floors, location = v.location::extensions.geography
from (values
  ('Mühendislik Fakültesi M1 Blok', 'Mühendislik Fakültesi Dekanlığı', 4, 'SRID=4326;POINT(30.330555 40.742473)'),
  ('Mühendislik Fakültesi M2 Blok', 'Mühendislik Fakültesi M2 Binası', 4, 'SRID=4326;POINT(30.331321 40.742182)'),
  ('Fen Edebiyat Fakültesi', 'Fen Edebiyat Fakültesi', 4, 'SRID=4326;POINT(30.328765 40.744688)'),
  ('Merkez Kütüphane', 'Süleyman Demirel Kütüphanesi', 3, 'SRID=4326;POINT(30.332082 40.741665)'),
  ('Rektörlük', 'Rektörlük Binası', 4, 'SRID=4326;POINT(30.332900 40.740939)'),
  ('Merkez Yemekhane', 'Öğrenci Yemekhanesi', 2, 'SRID=4326;POINT(30.330407 40.744271)'),
  ('İşletme Fakültesi', 'Hukuk Fakültesi', 4, 'SRID=4326;POINT(30.336668 40.740891)'),
  ('Kongre ve Kültür Merkezi', 'Kültür ve Kongre Merkezi', 2, 'SRID=4326;POINT(30.329331 40.741242)')
) as v(old_name, name, floors, location)
where b.name = v.old_name;

insert into buildings (name, floors, location)
select v.name, v.floors, v.location::extensions.geography
from (values
  ('Mühendislik Fakültesi M4 Binası', 4, 'SRID=4326;POINT(30.330928 40.741864)'),
  ('Mühendislik Fakültesi M6 Binası', 4, 'SRID=4326;POINT(30.330645 40.741632)'),
  ('M7 Makine Mühendisliği', 4, 'SRID=4326;POINT(30.327127 40.741897)'),
  ('İnşaat Mühendisliği', 4, 'SRID=4326;POINT(30.327734 40.742373)'),
  ('Bilgisayar ve Bilişim Bilimleri Fakültesi', 4, 'SRID=4326;POINT(30.325708 40.742277)'),
  ('İlahiyat Fakültesi', 4, 'SRID=4326;POINT(30.324540 40.743385)'),
  ('İnsan ve Toplum Bilimleri Fakültesi', 4, 'SRID=4326;POINT(30.336263 40.743747)'),
  ('Sanat, Tasarım ve Mimarlık Fakültesi', 4, 'SRID=4326;POINT(30.335573 40.739785)'),
  ('Devlet Konservatuvarı', 3, 'SRID=4326;POINT(30.332985 40.738357)'),
  ('Fen Bilimleri Enstitüsü', 3, 'SRID=4326;POINT(30.334245 40.743068)'),
  ('T1 Binası', 3, 'SRID=4326;POINT(30.332190 40.740365)'),
  ('T3 Binası', 3, 'SRID=4326;POINT(30.331929 40.740052)'),
  ('T4 Binası', 3, 'SRID=4326;POINT(30.334034 40.739749)'),
  ('Kütüphane Ek Bina', 2, 'SRID=4326;POINT(30.332222 40.741955)'),
  ('Bilgisayar Araştırma ve Uygulama Merkezi', 2, 'SRID=4326;POINT(30.331139 40.740811)'),
  ('Uzaktan Eğitim Araştırma ve Uygulama Merkezi', 2, 'SRID=4326;POINT(30.331371 40.740721)'),
  ('Uluslararası Ofis', 2, 'SRID=4326;POINT(30.332101 40.743028)'),
  ('Personel Yemekhanesi', 1, 'SRID=4326;POINT(30.327732 40.743649)'),
  ('Kampüs Kafeterya', 1, 'SRID=4326;POINT(30.330390 40.744008)'),
  ('Merkez Kantin', 1, 'SRID=4326;POINT(30.331921 40.742155)'),
  ('Kampüs Camii', 1, 'SRID=4326;POINT(30.333939 40.744359)'),
  ('Sabahattin Zaim Öğrenci Yurdu', 5, 'SRID=4326;POINT(30.338471 40.736120)'),
  ('Sakarya Teknokent', 4, 'SRID=4326;POINT(30.338839 40.741375)'),
  ('Dolmuş ve Otobüs Durakları', 0, 'SRID=4326;POINT(30.328979 40.740467)')
) as v(name, floors, location)
where not exists (select 1 from buildings b where b.name = v.name);

-- QR places sat on the old placeholder points; move them to their building.
update places p set location = b.location from buildings b where b.id = p.building_id;
-- Seed reports used the building point as their location; keep them on the real building.
update reports r set location = b.location
from buildings b
where b.id = r.building_id and r.reporter_id is null;
