# Hat: Harita

Dal: `hat/harita`
Sorumlu: tunahan
Kapsam: Plan 2'nin ilk parçası (`/` kampüs haritası gerçek veriyle). Plan 2'nin yazılı planı henüz yok; bu hat proje rehberindeki P0 madde 3'ü uygular.

## Son durum

`/` gerçek MapLibre haritası (OpenFreeMap, API anahtarı yok) ve Supabase verisiyle çalışıyor. Binalar OpenStreetMap'teki gerçek Esentepe binaları. Tarayıcıda 1440 px ve 390 px'te doğrulandı.

## Sıradaki adım

1. PR'ı aç, CI yeşil olunca kullanıcı onayıyla `main`e birleştir. `docs/durum/README.md` tablosuna "Harita" satırı eklenmeli (hat dalında README'ye dokunulmadı).
2. Vercel'de yayın sonrası canlıda `/` kontrolü (worker dosyası `public/`a build sırasında kopyalanıyor).
3. Sonraki Plan 2 işleri: `/bildirimlerim` gerçek veri + Realtime, bildirim detayında gerçek olay geçmişi (`report_events`).

## Yapılanlar

- 2026-10-27 OSM'den kampüs binaları çekildi (Overpass, kampüs alanı way 216324005: 180 bina, 42 isimli). Eşleştirme sayfası: https://claude.ai/artifact/4346S2tRQT7QRX84fseBAB
- 2026-10-27 Migration `20261027000004_real_buildings.sql`: 8 yer tutucu bina yerinde yeniden adlandırıldı (QR yerleri ve bildirimler kimliklerini korudu), 24 isimli bina eklendi; toplam 32. `seed.sql` yeni adlarla güncellendi. MCP ile uygulandı. Commit `a6fef9c`.
- 2026-10-27 Migration `20261027000005_map_support.sql`: `building_points` görünümü (lat/lng), `public_reports`'a `cover_path` (ilk "önce" fotoğrafı), `report_votes` için `vote_count`'u güncelleyen tetikleyici. MCP ile uygulandı; oy tetikleyicisi geri alınan bir işlemde denendi.
- 2026-10-27 Web: `lib/campus.ts` (filtre, binaya göre gruplama ve konumdan en yakın bina, kat etiketi, göreli zaman, zaman çizelgesi) + testleri; `components/map/{MapCanvas,CampusMapView,MapReportDetail}`; `app/(ogrenci)/page.tsx` sunucuda bina, bildirim, birim ve kullanıcının oylarını çeker, kapak fotoğrafları için imzalı URL üretir. "Ben de yaşıyorum" gerçek `report_votes` kaydı yapar. Eski şematik demo harita (`student-demo/CampusMap`, `CampusArtwork`) kaldırıldı. Testler 101/101, lint ve typecheck temiz, production build başarılı.

## Engeller

Yok.

## Bilinen eksikler

- İsimsiz OSM binaları ve OSM'de bulunmayan fakülteler (Tıp, Sağlık Bilimleri, Diş Hekimliği, Eğitim, İşletme, İletişim, Siyasal Bilgiler, Teknik Eğitim) sonra eşleştirilecek (kullanıcı kararı).
- Bina kat sayıları tahmin.
- Zaman çizelgesi durumdan türetiliyor; başkasının bildiriminin `report_events` kayıtları RLS gereği okunamıyor. Gerçek olay saatleri yalnızca kendi bildiriminde gösterilebilir (sonraki iş).
- Harita sayfası her ziyarette en fazla 300 bildirim çeker; Realtime yok.

## Alınan kararlar

- Harita karoları: OpenFreeMap `positron` stili (rehberdeki seçim; anahtar gerekmiyor).
- MapLibre worker'ı paketleyiciden sonra kendi yolunu bulamıyor; `scripts/copy-maplibre-worker.mjs` `dev` ve `build` öncesinde dosyayı `public/`a kopyalar, `setWorkerUrl` ile gösterilir. Dosya git'e girmez; `proxy.ts` eşleyicisi `.mjs` dosyalarını giriş kontrolünden muaf tutar.
- Pin butonları React portal ile MapLibre marker öğelerine çizilir; testlerde `MapCanvas` sahte bileşenle değiştirilir (jsdom'da WebGL yok).
- Kapak fotoğrafı `public_reports` üzerinden tüm giriş yapmış kullanıcılara açıldı (tasarımda haritada fotoğraf var); `report_media` tablosu gizli kalır. Fotoğraflar yüklemede EXIF'ten arındırılıyor.
- Bina kaydı olmayan ama konumu olan bildirimler en yakın binada gösterilir.

## Diğer hatlara notlar

- `public_reports` görünümüne `cover_path` sütunu eklendi; mevcut sorgular etkilenmez.
- Oy sayısı artık `report_votes` tetikleyicisiyle güncelleniyor; istemci `vote_count`'u elle artırmamalı.
