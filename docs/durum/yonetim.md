# Hat: Yönetim

Dal: `hat/yonetim` (birleşti), `hat/yonetim-2`
Sorumlu: tunahan
Kapsam: Plan 4, yönetim paneli (proje rehberi "Yönetim" ekranları: `/yonetim`, `/yonetim/bildirimler`, `/yonetim/birimler`, `/yonetim/kampus-sesi`).

## Son durum

Yönetim panelinin dört ekranı da gerçek veriyle çalışıyor: Genel bakış, Bildirimler, Birimler, Kampüs sesi. `components/admin-demo` altında yalnızca ortak kabuk, `ui.tsx` ve stil dosyası kaldı.

## Sıradaki adım

Tamamlandı, `main`de. Bu hatta açık iş yok; genel açık işler [README.md](README.md)'de.

## Yapılanlar

- 2026-10-28 Migration `20261028000009_admin_reports.sql`: `report_notes` (iç not; öğrencinin okuyabildiği `report_events` dışında tutulur, yönetim ve ilgili birim okur) ve `admin_update_report(rid, to_unit, to_urgency, to_status, to_staff, note)`. Tek işlemde birim, aciliyet, durum (`cozuldu`'da `resolved_at`), tek teknisyen ataması ve not; birim değişince `devredildi`, durum değişince `durum` olayı yazar. MCP ile uygulandı; geri alınan işlemde öğrenci reddedildi, başka birimin personeli reddedildi, öğrenci notları göremedi.
- 2026-10-28 Web: `lib/admin.ts` (dönem başlangıcı, hedef süre ve gecikme, KPI'lar, doğrulanmadan kapatılan işler, birim performansı, filtreler, kurala dayalı haftalık özet) + testleri. `app/yonetim/data.ts` ortak sunucu yükleyicisi. `components/admin/{OverviewView,ReportsView,types,fixtures}` demo tasarımıyla aynı düzende. Isı haritası gerçek MapLibre haritası (binalara göre açık bildirim sayısı, kırmızı nokta acil). `MapCanvas` kap boyutu değişince yeniden ölçeklenir (ResizeObserver). Demo `Overview`/`Reports` ve testleri silindi. Testler 141/141.
- 2026-10-28 Tarayıcı doğrulaması (yönetim hesabı): Genel bakış 13 açık, 3 acil bildirim gösterdi; "İncele" acil filtresine götürdü; #3 Yapı İşleri'ne yönlendirildi, teknisyen atandı, iç not eklendi; veritabanında `devredildi` olayı, atama ve not görüldü. Ardından #3 geri alındı.

- 2026-10-28 Migration `20261028000010_admin_units_voice.sql`: `set_material_request_status` (yalnızca yönetim; `hazir` stoktan düşer, yetersizse reddeder; bitmiş talep değişmez), `publish_suggestion_reply` (yanıt, durum ve isteğe bağlı olarak öneri sahibi ile oy verenlere `notifications`), `suggestion_votes` için oy sayısı tetikleyicisi, demo öğrenci adına 6 örnek öneri. MCP ile uygulandı; geri alınan işlemde personel ve öğrenci reddedildi, stok 6'dan 4'e düştü, fazla talep reddedildi, bildirim yazıldı.
- 2026-10-28 AI servisi: `/ai/draft-reply` (yalnızca yönetim, kişisel veri maskelenir, hata olursa boş taslak, `ai_runs` kaydı) + 4 test; pytest 68/68. Web: `lib/ai.ts` `draftReply`.
- 2026-10-28 Web: `components/admin/{UnitsView,CampusVoiceView}`; `app/yonetim/staff.ts` ortak personel ve atama yükleyicisi. Birimler: birim kartları, ekip (atanmış süren işi olan "Sahada"), atanmamış işi personele atama, birimin bekleyen malzeme talepleri (Hazırla, Hazır, Reddet). Kampüs sesi: filtre ve sıralama, yapay zeka taslağı, yanıt yayınlama. Demo `Units`, `CampusVoice`, `data.ts` ve testleri silindi. Testler 145/145.
- 2026-10-28 Tarayıcı doğrulaması (yönetim hesabı): Birimler gerçek birimleri ve Demo Personel'i gösterdi; Kampüs sesi'nde yerel AI servisiyle Gemini Türkçe taslak yazdı, yayınlama 1 kişiye bildirim gönderdi. Test yanıtı ve bildirimi silindi.

## Engeller

Yok.

## Bilinen eksikler

- Hedef süreler sabit: acil 1, orta 3, düşük 7 gün (`TARGET_DAYS`). Öğrenciye gösterilen tahminden (`resolutionEstimate`) bağımsız.
- "Öğrenci memnuniyeti" KPI'si yerine "Doğrulanmadan kapatılan" var; puanlama verisi yok.
- Hassas bildirim uyarısı yerine acil bildirim uyarısı var: `security_reports` yalnızca güvenlik rolüne açık.
- Haftalık özet yapay zeka değil, kurallarla derleniyor.
- Panel son 500 bildirimi yükler; sayfalama yok.
- Birleştirme yok.
- Personel durumu yalnızca atamaya göre: "İzinli" bilgisi tutulmuyor.
- Örnek önerilerin oy sayıları seed değeri; gerçek oy kaydı yok. Oy verenlere bildirim yalnızca gerçek `suggestion_votes` kayıtlarına gider.

## Alınan kararlar

- Yönetim değişiklikleri doğrudan tablo güncellemesi yerine tek bir güvenlik tanımlı fonksiyonla yapılır: olay kaydı, atama ve not tutarlı kalır.
- İç not ayrı tabloda; `report_events` öğrenciye açık olduğu için oraya yazılmaz.
- Bir bildirime tek teknisyen atanır.
