# Hat: Birleşme

Task'lar: 9, 10
Dal: `hat/entegrasyon`
Sorumlu: tunahan

## Son durum

Task 9 tamam (`/bildir` uçtan uca, gerçek Supabase + Gemini ile doğrulandı). Öğrenci iskeleti ve Hesabım tasarım tuvaline uyduruldu. Sıradaki: Task 10 (dağıtım ve CI).

## Sıradaki adım

Task 10 Step 1: `services/ai/Dockerfile`, `render.yaml`, `.github/workflows/{web,ai}.yml`. Ön koşul: Render ve Vercel hesapları GitHub'a bağlı olmalı.

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 PR #1, #2, #3 `main`e birleştirildi; `hat/entegrasyon` açıldı.
- 2026-10-27 Tasarım: `docs/tasarim/` = tasarım tuvalinden (claude.ai artifact "Çözüm Kampüs: Ekran Tasarımları") dışa aktarılan `.dc.html` ekranları; `eski-mobil/` geçersiz eski taslaklar. Öğrenci iskeleti tasarıma uyduruldu: ortada yüzen ikonlu cam menü (`components/layout/TopNav.tsx`), dekoratif kampüs zemini (`Stage.tsx`), tasarım sınıfları (`globals.css` içinde `.t .btn-ink .ghost .tile .pill .lbl .sec .field .skip .topbar .content .cols`), `PageContent`/`PageHeader`. Hesabım tasarımdaki gibi (özet kartı + sayılar, kilitli okul alanları, ad/dil kaydı, hesap silme şimdilik pasif).
- 2026-10-27 Task 9: `/bildir` tasarıma göre: Fotoğraf/Yazı/Ses sekmeleri, 3 fotoğraf kutusu (çek/galeri, ilk fotoğrafta yapay zeka etiketi), sesle anlatım (`tr-TR`), QR ile kilitli konum ya da bina + kat seçimi + GPS, anonim anahtarı, yapay zeka analiz paneli (kategori düzenlenebilir, birim yeniden hesaplanır, tahmini çözüm aciliyetten), hassas konu kartı (anonim güvenlik kanalı `security_reports`'a yazar) ve acil durum (`tel:`, varsayılan 112). Yardımcılar: `lib/ai.ts`, `lib/report.ts`, `lib/submit.ts`, `lib/speech.ts`, `lib/labels.ts`. Testler 61/61.
- 2026-10-27 Task 9 elle doğrulama: (1) öğrenci `/bildir?yer=M1-K2-WC` -> giriş -> QR konumu kilitli; (2) GPS EXIF'li fotoğraf yüklendi, Gemini analizi panelde (`Koridorda açıkta sarkan kablo`, %88), gönderildi -> `reports` 13 `yonlendirildi`, `report_media` 1, `report_events` 1, `ai_runs` 1; (3) Storage'daki kopyada GPS ve cihaz bilgisi yok (Task 8 Step 3); (4) AI servisi kapalıyken yalnızca metinle bildirim -> `bekleniyor`, gönderildi -> `reports` 14 `alindi`.

## Engeller

Yok.

## Bilinen eksikler (sonraki planlar)

- AI servisi tamamen erişilemezse istemci yedeği kategori `diger` verir (sunucudaki kural tabanlı yedek daha akıllı). İstemciye de anahtar kelime yedeği eklenebilir.
- Benzer bildirim kartı ("Bu sorun zaten bildirilmiş") tasarımda var, P1 (Plan 5); arka uç henüz yok.
- Yükleme sonrası kaldırılan fotoğraf Storage'da kalıyor (yetim dosya). Temizlik işi sonra.
- Personel ve yönetim hesapları da öğrenci menüsünü görüyor; kendi menüleri Plan 3 ve 4'te.
- Konum haritası şematik (tasarımdaki gibi); gerçek MapLibre Plan 2.

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Gönderim akışı `lib/submit.ts` içinde ayrı fonksiyon (test edilebilir); plan bunu sayfa içinde varsaymıştı.
- Analiz bekleniyorsa (`ai_pending`) `ai_summary`, `ai_confidence`, `ai_materials` boş kaydedilir; yedek metin yapay zeka çıktısı gibi görünmesin.
- Analiz isteğinde ağ hatası da (yalnızca zaman aşımı ve 5xx değil) "bekleniyor"a düşer.
- Tasarımda olup plana yazılmamış öğeler eklendi: tahmini çözüm satırı, kategoriyi düzenle, anonim güvenlik kanalı formu.

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)
