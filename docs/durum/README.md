# Proje durumu (genel bakış)

Son güncelleme: 2026-10-27 (akşam)

Aktif öncelik: tüm web arayüzü — `docs/superpowers/plans/2026-10-27-frontend-tamamlama.md`. Durum: [frontend.md](frontend.md). Önceki planın kalan backend/dağıtım kontrolleri sonrasında ele alınacak.

## Hatlar

| Hat | Dal | Task'lar | Sorumlu | Durum dosyası | Durum |
|---|---|---|---|---|---|
| Temel | `main` | 1 | tunahan | bu dosya | Tamamlandı |
| DB | `hat/db` | 2 | tunahan | [db.md](db.md) | Tamamlandı, `main`de |
| AI servisi | `hat/ai` | 3, 4, 5 | tunahan | [ai.md](ai.md) | Tamamlandı, `main`de |
| Web | `hat/web` | 6, 7, 8 | tunahan | [web.md](web.md) | Tamamlandı, gerçek giriş ve yükleme doğrulandı |
| Birleşme | `hat/entegrasyon` | 9, 10 | tunahan | [entegrasyon.md](entegrasyon.md) | Task 9 tamam; üretim web/API çalışıyor, kalan kontroller entegrasyon.md içinde |

## Bağımlılıklar

- DB, AI, Web hatları birbirinden bağımsız; aynı anda başlayabilir.
- Web Task 7'nin elle testi için DB hattının Supabase projesi ve şeması hazır olmalı (birim testleri beklemez).
- Birleşme (Task 9, 10) üç hattın PR'ı `main`e girince başlar.

## Ortak kaynaklar

- Supabase projesi `cozumkampus` (ref `owvzlonnpiuigrstsean`). Claude oturumlarında Supabase MCP bağlı. Anahtarlar yalnızca `.env`'de; ekibe güvenli kanaldan.
- Yapay zeka: Google Gemini (`gemini-3.5-flash`), OpenAI uyumlu uç nokta; anahtar `.env` `LLM_API_KEY`.
- Demo hesapları: `ogrenci@`, `personel@`, `yonetim@`, `guvenlik@demo.cozumkampus.app`, şifre `.env` `DEMO_PASSWORD`.
- GitHub: https://github.com/tunahntopbas/cozum-kampus (private).
- Tasarımlar: `docs/tasarim/*.dc.html` (kaynak: claude.ai tasarım tuvali "Çözüm Kampüs: Ekran Tasarımları"). Arayüz bu dosyalara birebir uyulmalı.

## Yerelde çalıştırma

- Web: `pnpm dev:web` -> http://localhost:3100
- AI: `cd services/ai && uv run uvicorn app.main:app --reload --port 8000`
- `apps/web/.env.local` = kök `.env` içindeki `NEXT_PUBLIC_*` satırları.

## Sonraki planlar

1. Temel ve bildirim hattı (aktif)
2. Harita, bildirim detayı, `/bildirimlerim`, Realtime
3. Personel ekranları
4. Yönetim paneli
5. P1 kalanlar
6. Mobil uygulama
