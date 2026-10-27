# Hat: Personel

Dal: `hat/personel`
Sorumlu: tunahan
Kapsam: Plan 3'ün ilk parçası (proje rehberi P0 madde 5: `/personel` iş listesi, çözüm fotoğrafı, `verify-resolution`).

## Son durum

`/personel` gerçek veriyle çalışıyor. Birimin açık işleri aciliyet ve bildirim saatine göre sıralanıyor. Adımlar: Yola çık (`atandi`), İşe başla (`islemde`), çözüm fotoğrafı (yapay zeka doğrulaması), İşi tamamla (`cozuldu`). Devret, güvenlik tanımlı fonksiyonla başka birime aktarıyor. Personel ve yönetim `/` açınca kendi ekranına yönlenir. Tarayıcıda gerçek Gemini doğrulamasıyla uçtan uca denendi.

## Sıradaki adım

1. PR'ı aç, CI yeşil olunca kullanıcı onayıyla `main`e birleştir; `docs/durum/README.md` tablosuna "Personel" satırı eklenmeli.
2. Plan 3 kalanlar: `/personel/gecmis` ve `/personel/malzeme` hâlâ demo veriyle (`components/staff-demo/{History,Materials}`). Geçmiş, birimin `cozuldu` bildirimleri ve `report_events` ile gerçeğe bağlanabilir; malzeme için tablo yok (şema kararı gerekli).
3. Plan 4: yönetim paneli.

## Yapılanlar

- 2026-10-28 Migration `20261028000007_staff_handoff.sql`: `handoff_report(rid, to_unit, reason)`. RLS personelin `unit_id`'yi başka birime yazmasına izin vermediği için gerekli. Yalnızca o birimin personeli ya da yönetim, açık bildirim için; `devredildi` olayı yazar, durumu `yonlendirildi` yapar. MCP ile uygulandı, geri alınan işlemde doğrulandı (öğrenci reddedildi, personel devretti, devirden sonra bildirimi göremez).
- 2026-10-28 Web: `lib/ai.ts` `verifyResolution` (servis yoksa "bekliyor" sonucu; 403 hata) ve ortak `withTimeout`; `lib/staff.ts` (sıralama, sonraki adım, tamamlanan adım sayısı, İstanbul saatine göre gün) + testleri; `components/staff/{StaffJobsView,types}`; `app/personel/page.tsx` sunucuda birimin bildirimlerini, fotoğraf yollarını ve imzalı URL'leri, binaları, birimleri çeker. Demo `staff-demo/Jobs` ve testleri kaldırıldı; `staff-demo/Shared` `Photo` bileşenine `alt` ve `placeholder` eklendi. `lib/auth.ts` `homeFor(role)`; `proxy.ts` personeli `/personel`'e, yönetimi `/yonetim`'e yönlendirir. Testler 123/123.
- 2026-10-28 Tarayıcı doğrulaması (personel hesabı, #13): Yola çık, İşe başla, çözüm fotoğrafı yüklendi, Gemini sentetik görseli "doğrulanamadı (%95)" diye reddetti, "Yine de tamamla" ile `cozuldu`. Veritabanında 3 `durum` olayı (sonuncusunda yapay zeka kararı) ve `sonra` fotoğrafı görüldü. Ardından #13 `yonlendirildi`ye döndürüldü, test olayları, medya kaydı ve Storage dosyası silindi.

## Engeller

Yok.

## Bilinen eksikler

- Yapay zeka doğrulayamasa da personel "Yine de tamamla" ile kapatabilir; karar olay kaydında (`payload.ai`) kalır, yönetim panelinde incelenmeli (Plan 4).
- `report_media.ai_verified` ve `ai_confidence` doldurulmuyor (personelin `report_media` güncelleme izni yok); karar `report_events`'te.
- Rota sırası gerçek konuma göre değil (personel konumu yok); "Rota" butonu Google Haritalar'da binaya yol tarifi açar.
- `assignments` tablosu kullanılmıyor (yalnızca yönetim yazabiliyor); iş birime atanır, kişiye değil.
- Öğrenciye bildirim gönderilmiyor (Plan 5); öğrenci durumu Bildirimlerim'de Realtime ile görür.

## Alınan kararlar

- Personel durumu doğrudan `reports` üzerinden günceller (RLS izin veriyor) ve her adımda `report_events`'e `{ type: "durum", payload: { to } }` yazar; tamamlamada not ve yapay zeka kararı da payload'a girer.
- Yapay zeka servisi yoksa ya da hata verirse teknisyen engellenmez (bildirim tarafındaki sözleşmeyle aynı).
- Personel ve yönetim için `/` kendi başlangıç sayfasına yönlenir; rehberde personel arayüzünde harita sekmesi yok.

## Diğer hatlara notlar

- Yönetim paneli "doğrulanamadı ama tamamlandı" işleri `report_events` içinde `type = 'durum' and payload->>'to' = 'cozuldu' and payload->'ai'->>'resolved' = 'false'` ile bulabilir.
