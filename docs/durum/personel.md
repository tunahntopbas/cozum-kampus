# Hat: Personel

Dal: `hat/personel` (birleşti), `hat/personel-gecmis`
Sorumlu: tunahan
Kapsam: Plan 3 (proje rehberi P0 madde 5: `/personel` iş listesi, çözüm fotoğrafı, `verify-resolution`; `/personel/gecmis` ve `/personel/malzeme`).

## Son durum

`/personel` gerçek veriyle çalışıyor. Birimin açık işleri aciliyet ve bildirim saatine göre sıralanıyor. Adımlar: Yola çık (`atandi`), İşe başla (`islemde`), çözüm fotoğrafı (yapay zeka doğrulaması), İşi tamamla (`cozuldu`). Devret, güvenlik tanımlı fonksiyonla başka birime aktarıyor. Personel ve yönetim `/` açınca kendi ekranına yönlenir. Tarayıcıda gerçek Gemini doğrulamasıyla uçtan uca denendi.

`/personel/gecmis` ve `/personel/malzeme` de gerçek veriyle çalışıyor; personel arayüzünde demo ekran kalmadı.

## Sıradaki adım

1. `hat/personel-gecmis` PR'ı CI yeşil olunca kullanıcı onayıyla `main`e birleştir.
2. Plan 4: yönetim paneli (`/yonetim`, `/yonetim/bildirimler`, `/yonetim/birimler`, `/yonetim/kampus-sesi` hâlâ `components/admin-demo`). Malzeme taleplerini onaylama ekranı da burada (yönetim `material_requests` okuyabiliyor; güncelleme politikası henüz yok).

## Yapılanlar

- 2026-10-28 Migration `20261028000007_staff_handoff.sql`: `handoff_report(rid, to_unit, reason)`. RLS personelin `unit_id`'yi başka birime yazmasına izin vermediği için gerekli. Yalnızca o birimin personeli ya da yönetim, açık bildirim için; `devredildi` olayı yazar, durumu `yonlendirildi` yapar. MCP ile uygulandı, geri alınan işlemde doğrulandı (öğrenci reddedildi, personel devretti, devirden sonra bildirimi göremez).
- 2026-10-28 Web: `lib/ai.ts` `verifyResolution` (servis yoksa "bekliyor" sonucu; 403 hata) ve ortak `withTimeout`; `lib/staff.ts` (sıralama, sonraki adım, tamamlanan adım sayısı, İstanbul saatine göre gün) + testleri; `components/staff/{StaffJobsView,types}`; `app/personel/page.tsx` sunucuda birimin bildirimlerini, fotoğraf yollarını ve imzalı URL'leri, binaları, birimleri çeker. Demo `staff-demo/Jobs` ve testleri kaldırıldı; `staff-demo/Shared` `Photo` bileşenine `alt` ve `placeholder` eklendi. `lib/auth.ts` `homeFor(role)`; `proxy.ts` personeli `/personel`'e, yönetimi `/yonetim`'e yönlendirir. Testler 123/123.
- 2026-10-28 Tarayıcı doğrulaması (personel hesabı, #13): Yola çık, İşe başla, çözüm fotoğrafı yüklendi, Gemini sentetik görseli "doğrulanamadı (%95)" diye reddetti, "Yine de tamamla" ile `cozuldu`. Veritabanında 3 `durum` olayı (sonuncusunda yapay zeka kararı) ve `sonra` fotoğrafı görüldü. Ardından #13 `yonlendirildi`ye döndürüldü, test olayları, medya kaydı ve Storage dosyası silindi.

- 2026-10-28 Migration `20261028000008_materials.sql`: mevcut `inventory` ve `material_requests` tabloları kullanıldı. Talep notu, miktar ve durum kısıtları, birim başına tekil malzeme adı; ekleme politikası yalnızca kendi adına, `onay_bekliyor` durumunda ve kendi biriminin stoğundan talebe izin verir. Yapı İşleri (9), Bilgi İşlem (2), Temizlik (1) için örnek stok. MCP ile uygulandı ve doğrulandı (başka birimin malzemesine talep reddedildi).
- 2026-10-28 Web: `lib/staff.ts` `stockLevel`, `neededMaterials` (yapay zekanın serbest metin malzeme adlarını stokla eşler), `jobMinutes`, `completionVerdict`, talep tipleri. `components/staff/{HistoryView,MaterialsView}` demo arayüzüyle aynı düzende; `app/personel/{gecmis,malzeme}/page.tsx` sunucuda veriyi çeker. Demo `staff-demo/{History,Materials}` ve testleri silindi, başlıktaki "Demo verileri" etiketi kaldırıldı. Testler 129/129.
- 2026-10-28 Tarayıcı doğrulaması (personel hesabı): Geçmiş #9'u gösterdi; Malzeme 11 açık işten 12 kalem derledi, "Eksikleri depodan iste" 5 talep yazdı. Test talepleri silindi.

## Engeller

Yok.

## Bilinen eksikler

- Yapay zeka doğrulayamasa da personel "Yine de tamamla" ile kapatabilir; karar olay kaydında (`payload.ai`) kalır, yönetim panelinde incelenmeli (Plan 4).
- `report_media.ai_verified` ve `ai_confidence` doldurulmuyor (personelin `report_media` güncelleme izni yok); karar `report_events`'te.
- Rota sırası gerçek konuma göre değil (personel konumu yok); "Rota" butonu Google Haritalar'da binaya yol tarifi açar.
- `assignments` tablosu kullanılmıyor (yalnızca yönetim yazabiliyor); iş birime atanır, kişiye değil.
- Öğrenciye bildirim gönderilmiyor (Plan 5); öğrenci durumu Bildirimlerim'de Realtime ile görür.
- Malzeme talebi stoktan düşmez ve yönetim onay ekranı yok (Plan 4). "Araçta" bilgisi tutulmuyor; yapay zekanın önerdiği ama depoda olmayan malzemeler "Depoda yok" görünür.
- Geçmiş süresi "İşe başla" olayından tamamlanmaya; olay yoksa bildirimden çözüme kadar ölçülür (eski seed kayıtlarda günler çıkabilir).

## Alınan kararlar

- Personel durumu doğrudan `reports` üzerinden günceller (RLS izin veriyor) ve her adımda `report_events`'e `{ type: "durum", payload: { to } }` yazar; tamamlamada not ve yapay zeka kararı da payload'a girer.
- Yapay zeka servisi yoksa ya da hata verirse teknisyen engellenmez (bildirim tarafındaki sözleşmeyle aynı).
- Personel ve yönetim için `/` kendi başlangıç sayfasına yönlenir; rehberde personel arayüzünde harita sekmesi yok.

## Diğer hatlara notlar

- Yönetim paneli "doğrulanamadı ama tamamlandı" işleri `report_events` içinde `type = 'durum' and payload->>'to' = 'cozuldu' and payload->'ai'->>'resolved' = 'false'` ile bulabilir.


## 2026-10-28 staff audit düzeltmeleri (commit yok, uygulanmadı)

- F1: `staff_update_report_status` RPC: birim/admin yetkisi, row lock, beklenen durum, izinli geçiş; durum + olay + mevcut trigger bildirimi tek transaction. `false` istemcide açık hata.
- F5: malzeme talepleri güncel sunucu props + başarılı yerel eklemelerden türetiliyor; aynı ID için sunucu öncelikli.
- F6: replacement başlangıcında karar temizlenir; karar tam medya yoluna bağlanır; kalıcı medya eklendikten sonra AI başarısız olsa da refresh yapılır. Faraday'ın `attachReportPhoto` akışı korunmuştur.
- CLI `migration new staff_atomic_status` ile üretilen dosya, gerçek saat eski olduğundan kullanıcı isteğiyle `20261028000013_staff_atomic_status.sql` olarak sıralandı; publication `00012` ayrı tutuldu. Migration uygulanmadı.
- Güven sınırı: browser `ai_verdict` güvenilir değildir; RPC bunu olayın AI kararı olarak kaydetmez (`ai: null`). Authoritative verify sonucunu exact media row'a servis yazmadan güvenilir AI sonucu kaydı eklenmemeli. Faraday ile bu sözleşme koordine edilmeli.
- Doğrulama: önce regresyonlar 6 hata verdi; sonraki koşu 13/13 geçti; `tsc --noEmit` ve hedefli ESLint geçti. İzole PGlite testi yetki, stale/missing, geçiş, fotoğraf bağı ve event/notification rollback senaryolarını geçti. Son eklenen 403/rerender testleri, null-unit yetki sıkılaştırması ve AI-input güven sınırı değişikliği kullanıcı bellek/swap talimatıyla tekrar koşturulmadı.
- Commit, dal değişimi, push ve dış veritabanı yazımı yapılmadı. Sıradaki adım: bellek uygun olduğunda son test değişikliklerini doğrula; authoritative verify persistence entegrasyonunu tamamla.
