# Hat: Yönetim

Dal: `hat/yonetim`
Sorumlu: tunahan
Kapsam: Plan 4, yönetim paneli (proje rehberi "Yönetim" ekranları: `/yonetim`, `/yonetim/bildirimler`, `/yonetim/birimler`, `/yonetim/kampus-sesi`).

## Son durum

Birinci parça bitti: Genel bakış ve Bildirimler gerçek veriyle çalışıyor. Birimler ve Kampüs sesi hâlâ demo (`components/admin-demo/{Units,CampusVoice}`); "Demo verileri" etiketi artık yalnızca bu iki ekranda.

## Sıradaki adım

1. Bu dalın PR'ı CI yeşil olunca kullanıcı onayıyla `main`e birleşir.
2. İkinci parça (`hat/yonetim-2`):
   - `/yonetim/birimler`: birim kartları `unitPerformance` ile; ekip `profiles` (role `staff`) ve `assignments`'tan; "İş ata" `admin_update_report` ile (yalnızca personeli değiştirerek). Malzeme taleplerini onaylama burada: `material_requests` için yönetim güncelleme politikası ya da RPC gerekli (şu an yalnızca okuma var).
   - `/yonetim/kampus-sesi`: `suggestions` (şu an 0 kayıt, `/oneriler` hâlâ demo) ve `suggestion_replies`. Yönetimin `suggestions` güncelleme ve `suggestion_replies` ekleme politikaları hazır. Yapay zeka taslağı için AI servisinde uç nokta yok.
3. Ardından birleştirme (`parent_report_id`) ve gerçek yapay zeka haftalık özeti.

## Yapılanlar

- 2026-10-28 Migration `20261028000009_admin_reports.sql`: `report_notes` (iç not; öğrencinin okuyabildiği `report_events` dışında tutulur, yönetim ve ilgili birim okur) ve `admin_update_report(rid, to_unit, to_urgency, to_status, to_staff, note)`. Tek işlemde birim, aciliyet, durum (`cozuldu`'da `resolved_at`), tek teknisyen ataması ve not; birim değişince `devredildi`, durum değişince `durum` olayı yazar. MCP ile uygulandı; geri alınan işlemde öğrenci reddedildi, başka birimin personeli reddedildi, öğrenci notları göremedi.
- 2026-10-28 Web: `lib/admin.ts` (dönem başlangıcı, hedef süre ve gecikme, KPI'lar, doğrulanmadan kapatılan işler, birim performansı, filtreler, kurala dayalı haftalık özet) + testleri. `app/yonetim/data.ts` ortak sunucu yükleyicisi. `components/admin/{OverviewView,ReportsView,types,fixtures}` demo tasarımıyla aynı düzende. Isı haritası gerçek MapLibre haritası (binalara göre açık bildirim sayısı, kırmızı nokta acil). `MapCanvas` kap boyutu değişince yeniden ölçeklenir (ResizeObserver). Demo `Overview`/`Reports` ve testleri silindi. Testler 141/141.
- 2026-10-28 Tarayıcı doğrulaması (yönetim hesabı): Genel bakış 13 açık, 3 acil bildirim gösterdi; "İncele" acil filtresine götürdü; #3 Yapı İşleri'ne yönlendirildi, teknisyen atandı, iç not eklendi; veritabanında `devredildi` olayı, atama ve not görüldü. Ardından #3 geri alındı.

## Engeller

Yok.

## Bilinen eksikler

- Hedef süreler sabit: acil 1, orta 3, düşük 7 gün (`TARGET_DAYS`). Öğrenciye gösterilen tahminden (`resolutionEstimate`) bağımsız.
- "Öğrenci memnuniyeti" KPI'si yerine "Doğrulanmadan kapatılan" var; puanlama verisi yok.
- Hassas bildirim uyarısı yerine acil bildirim uyarısı var: `security_reports` yalnızca güvenlik rolüne açık.
- Haftalık özet yapay zeka değil, kurallarla derleniyor.
- Panel son 500 bildirimi yükler; sayfalama yok.
- Birleştirme yok.

## Alınan kararlar

- Yönetim değişiklikleri doğrudan tablo güncellemesi yerine tek bir güvenlik tanımlı fonksiyonla yapılır: olay kaydı, atama ve not tutarlı kalır.
- İç not ayrı tabloda; `report_events` öğrenciye açık olduğu için oraya yazılmaz.
- Bir bildirime tek teknisyen atanır.
