# Hat: Birleşme

Task'lar: 9, 10
Dal: `hat/entegrasyon`
Sorumlu: tunahan

## Son durum

Render ve Vercel üretim dağıtımları tamam. Canlı şifreli giriş, QR konumu, Gemini analizi ve bildirim kaydı doğrulandı. Task 10 Step 3 tamam; Step 4'te fotoğraflı canlı test ve Supabase Auth URL ayarı bekliyor. Planın son kod incelemesi henüz yapılmadı.

## Sıradaki adım

1. Supabase Auth URL Configuration'a `https://cozum-kampus.vercel.app/auth/callback` ekle; Site URL'yi üretim adresine ayarla (MCP bu ayarı sunmuyor; panel veya yetkili Management API gerekli).
2. Canlı sitede fotoğraflı bildirim senaryosunu da tamamla. Metinli canlı bildirim #15 doğrulandı.
3. Girişte `next=/bildir?...` verilmesine rağmen ilk canlı denemede ana sayfaya gidildi; tekrar incele. Oturum açıldıktan sonra doğrudan QR bağlantısı çalışıyor.
4. Plan 1'in son kod incelemesini yap, ardından Plan 2 (harita, bildirim detayı, Bildirimlerim, Realtime). Tasarımlar `docs/tasarim/`.

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 PR #1, #2, #3 `main`e birleştirildi; `hat/entegrasyon` açıldı.
- 2026-10-27 Tasarım: `docs/tasarim/` = tasarım tuvalinden (claude.ai artifact "Çözüm Kampüs: Ekran Tasarımları") dışa aktarılan `.dc.html` ekranları; `eski-mobil/` geçersiz eski taslaklar. Öğrenci iskeleti tasarıma uyduruldu: ortada yüzen ikonlu cam menü (`components/layout/TopNav.tsx`), dekoratif kampüs zemini (`Stage.tsx`), tasarım sınıfları (`globals.css` içinde `.t .btn-ink .ghost .tile .pill .lbl .sec .field .skip .topbar .content .cols`), `PageContent`/`PageHeader`. Hesabım tasarımdaki gibi (özet kartı + sayılar, kilitli okul alanları, ad/dil kaydı, hesap silme şimdilik pasif).
- 2026-10-27 Task 9: `/bildir` tasarıma göre: Fotoğraf/Yazı/Ses sekmeleri, 3 fotoğraf kutusu (çek/galeri, ilk fotoğrafta yapay zeka etiketi), sesle anlatım (`tr-TR`), QR ile kilitli konum ya da bina + kat seçimi + GPS, anonim anahtarı, yapay zeka analiz paneli (kategori düzenlenebilir, birim yeniden hesaplanır, tahmini çözüm aciliyetten), hassas konu kartı (anonim güvenlik kanalı `security_reports`'a yazar) ve acil durum (`tel:`, varsayılan 112). Yardımcılar: `lib/ai.ts`, `lib/report.ts`, `lib/submit.ts`, `lib/speech.ts`, `lib/labels.ts`. Testler 61/61.
- 2026-10-27 Task 9 elle doğrulama: (1) öğrenci `/bildir?yer=M1-K2-WC` -> giriş -> QR konumu kilitli; (2) GPS EXIF'li fotoğraf yüklendi, Gemini analizi panelde (`Koridorda açıkta sarkan kablo`, %88), gönderildi -> `reports` 13 `yonlendirildi`, `report_media` 1, `report_events` 1, `ai_runs` 1; (3) Storage'daki kopyada GPS ve cihaz bilgisi yok (Task 8 Step 3); (4) AI servisi kapalıyken yalnızca metinle bildirim -> `bekleniyor`, gönderildi -> `reports` 14 `alindi`.

- 2026-10-27 Task 10 Step 1, 2, 5: `services/ai/Dockerfile` (python:3.12-slim + uv) ve `.dockerignore`, `render.yaml` (ücretsiz, frankfurt, `/health`), `.github/workflows/web.yml` (lint, typecheck, test, build) ve `ai.yml` (ruff, pytest, Docker imajı + `/health` denemesi). CI düzeltmeleri: `app/config.py` sığ kurulum yolunda `.env` aramasında çökmüyor; pnpm lockfile yenilendi; `lib/auth.test.ts` env'e bağımlı olmaktan çıkarıldı. PR #5, iki workflow yeşil.

- 2026-10-27 Vercel: `tunahntopbas-projects/cozum-kampus`, root `apps/web`, GitHub bağlantısı kuruldu. Üretim: https://cozum-kampus.vercel.app, deploy `dpl_7xrDKUkaGaTpCe9XMmZ4x4rMpXdN` READY. `NEXT_PUBLIC_*` değerleri aktarıldı ve geri okunarak eşitliği doğrulandı; servis/LLM anahtarları Vercel'e aktarılmadı. Render `ALLOWED_ORIGIN` üretim adresine güncellendi; CORS OPTIONS 200 ve doğru origin doğrulandı.
- Canlı tarayıcı testi: demo öğrenci girişi, QR `M1-K2-WC` kilitli konum, metin analizi, gönderim -> `/bildirimlerim?yeni=15`. SQL doğrulaması: bildirim #15 `aydinlatma`, `yonlendirildi`, `yapi_isleri`, güven 0.98, `place_id=2`.
- CLI dağıtımı izlenmeyen `… 2` dosyalarının yüklenmemesi için temiz `/tmp/cozum-kampus-vercel` worktree'sinden (main `da3bc41`) yapıldı. Vercel proje bağlantısı bu worktree'de; normal klasörden CLI kullanırken `--project cozum-kampus --scope tunahntopbas-projects` veya `vercel link` gerekli.

## Engeller

- 2026-10-27 Codex bağlantı kontrolü: Supabase MCP çalışıyor; proje ACTIVE_HEALTHY, 14 bildirim, 5 birim, 8 bina doğrulandı.
- Render dağıtımı tamam (2026-10-27): servis `srv-dbgf487b9u1s73c617rg`, URL `https://cozum-kampus-ai.onrender.com`, ücretsiz Frankfurt. Deploy `dep-dbgf4p0m7kps73890u50` LIVE, commit `da3bc41`. İlk deploy dört eksik ayar yüzünden çöktü; `.env` içindeki sunucu ayarları MCP ile aktarıldı (değerler depoya yazılmadı). `/health` 200; demo öğrenciyle Supabase Auth girişi + canlı analiz 7,6 sn, `aydinlatma`, `yapi_isleri`, `ai_pending=false`. Vercel dağıtımı ve metinli canlı web testi de tamamlandı (aşağıya bak).
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
