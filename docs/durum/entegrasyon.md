# Hat: Birleşme

Task'lar: 9, 10
Dal: `hat/entegrasyon`
Sorumlu: tunahan

## Son durum

Task 9 tamam. Task 10 kod kısmı tamam: PR #5 (Dockerfile, `render.yaml`, GitHub Actions) CI yeşil, `main`e birleştirildi. Kalan: Render ve Vercel'e canlı dağıtım (Step 3'ün panel kısmı ve Step 4).

## Sıradaki adım

1. `git checkout main && git pull`, sonra yeni dal (ör. `hat/dagitim`) aç.
2. Task 10 Step 3 panel kısmı (kullanıcı yapar): Render'da "New > Blueprint" ile depoyu bağla (`render.yaml` okunur), gizli değerleri gir (`LLM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `ALLOWED_ORIGIN` = Vercel alan adı). Vercel'de depoyu içe aktar, Root Directory `apps/web`, `NEXT_PUBLIC_*` değerlerini gir (`NEXT_PUBLIC_AI_API_URL` = Render adresi).
3. Task 10 Step 4: Supabase Auth > URL Configuration'a Vercel alan adını ekle; canlıda Task 9 senaryo 1 ve 2'yi tekrarla.
4. Planın son tüm dal incelemesi, sonra Plan 2.

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 PR #1, #2, #3 `main`e birleştirildi; `hat/entegrasyon` açıldı.
- 2026-10-27 Tasarım: `docs/tasarim/` = tasarım tuvalinden (claude.ai artifact "Çözüm Kampüs: Ekran Tasarımları") dışa aktarılan `.dc.html` ekranları; `eski-mobil/` geçersiz eski taslaklar. Öğrenci iskeleti tasarıma uyduruldu: ortada yüzen ikonlu cam menü (`components/layout/TopNav.tsx`), dekoratif kampüs zemini (`Stage.tsx`), tasarım sınıfları (`globals.css` içinde `.t .btn-ink .ghost .tile .pill .lbl .sec .field .skip .topbar .content .cols`), `PageContent`/`PageHeader`. Hesabım tasarımdaki gibi (özet kartı + sayılar, kilitli okul alanları, ad/dil kaydı, hesap silme şimdilik pasif).
- 2026-10-27 Task 9: `/bildir` tasarıma göre: Fotoğraf/Yazı/Ses sekmeleri, 3 fotoğraf kutusu (çek/galeri, ilk fotoğrafta yapay zeka etiketi), sesle anlatım (`tr-TR`), QR ile kilitli konum ya da bina + kat seçimi + GPS, anonim anahtarı, yapay zeka analiz paneli (kategori düzenlenebilir, birim yeniden hesaplanır, tahmini çözüm aciliyetten), hassas konu kartı (anonim güvenlik kanalı `security_reports`'a yazar) ve acil durum (`tel:`, varsayılan 112). Yardımcılar: `lib/ai.ts`, `lib/report.ts`, `lib/submit.ts`, `lib/speech.ts`, `lib/labels.ts`. Testler 61/61.
- 2026-10-27 Task 9 elle doğrulama: (1) öğrenci `/bildir?yer=M1-K2-WC` -> giriş -> QR konumu kilitli; (2) GPS EXIF'li fotoğraf yüklendi, Gemini analizi panelde (`Koridorda açıkta sarkan kablo`, %88), gönderildi -> `reports` 13 `yonlendirildi`, `report_media` 1, `report_events` 1, `ai_runs` 1; (3) Storage'daki kopyada GPS ve cihaz bilgisi yok (Task 8 Step 3); (4) AI servisi kapalıyken yalnızca metinle bildirim -> `bekleniyor`, gönderildi -> `reports` 14 `alindi`.

- 2026-10-27 Task 10 Step 1, 2, 5: `services/ai/Dockerfile` (python:3.12-slim + uv) ve `.dockerignore`, `render.yaml` (ücretsiz, frankfurt, `/health`), `.github/workflows/web.yml` (lint, typecheck, test, build) ve `ai.yml` (ruff, pytest, Docker imajı + `/health` denemesi). CI düzeltmeleri: `app/config.py` sığ kurulum yolunda `.env` aramasında çökmüyor; pnpm lockfile yenilendi; `lib/auth.test.ts` env'e bağımlı olmaktan çıkarıldı. PR #5, iki workflow yeşil.

## Engeller

- 2026-10-27 Codex bağlantı kontrolü: Supabase MCP çalışıyor; proje ACTIVE_HEALTHY, 14 bildirim, 5 birim, 8 bina doğrulandı.
- Render MCP araçları görünmesine rağmen `list_workspaces`, `get_selected_workspace`, `list_services` çağrıları `Unknown tool` döndürüyor. Vercel MCP araçları bu oturumda görünmüyor. Dağıtım yapılmadı; bağlantı yetkilendirmeleri yenilenince tekrar kontrol edilmeli.
- Yerelde `apps/web` altında izlenmeyen `… 2` kopyaları mevcut; kullanıcı dosyaları olduğu için değiştirilmedi ve commit edilmedi.

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
