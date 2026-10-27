# Proje durumu (genel bakış)

Son güncelleme: 2026-10-28

Aktif öncelik: demo provası. Öğrenci (harita, bildir, Bildirimlerim), personel (işler, geçmiş, malzeme) ve yönetim (4 ekran) gerçek veriyle canlıda. Hâlâ demo: `/oneriler`, `/bildirimler`. Mobil uyarlama ve P2 maddeleri elendi (jüri onayına bağlı). En son: anahtarları ve demo şifresini değiştir, Render'ı uyandır.

## Hatlar

| Hat | Dal | Task'lar | Sorumlu | Durum dosyası | Durum |
|---|---|---|---|---|---|
| Temel | `main` | 1 | tunahan | bu dosya | Tamamlandı |
| DB | `hat/db` | 2 | tunahan | [db.md](db.md) | Tamamlandı, `main`de |
| AI servisi | `hat/ai` | 3, 4, 5 | tunahan | [ai.md](ai.md) | Tamamlandı, `main`de |
| Web | `hat/web` | 6, 7, 8 | tunahan | [web.md](web.md) | Tamamlandı, gerçek giriş ve yükleme doğrulandı |
| Birleşme | `hat/entegrasyon` | 9, 10 | tunahan | [entegrasyon.md](entegrasyon.md) | Tamamlandı; canlı: Vercel + Render |
| Ön yüz (Codex) | `codex/frontend-complete` | ayrı plan | Codex | [frontend.md](frontend.md) | Tamamlandı, `main`de (demo ekranlar) |
| Harita | `hat/harita` | Plan 2 | tunahan | [harita.md](harita.md) | Tamamlandı, `main`de |
| Bildirimlerim | `hat/bildirimlerim` | Plan 2 | tunahan | [bildirimlerim.md](bildirimlerim.md) | Tamamlandı, `main`de |
| Personel | `hat/personel`, `hat/personel-gecmis` | Plan 3 | tunahan | [personel.md](personel.md) | Tamamlandı, `main`de |
| Yönetim | `hat/yonetim`, `hat/yonetim-2` | Plan 4 | tunahan | [yonetim.md](yonetim.md) | Tamamlandı, `main`de; AI `/ai/draft-reply` Render'da canlı |

## Bağımlılıklar

- DB, AI, Web hatları birbirinden bağımsız; aynı anda başlayabilir.
- Web Task 7'nin elle testi için DB hattının Supabase projesi ve şeması hazır olmalı (birim testleri beklemez).
- Birleşme (Task 9, 10) üç hattın PR'ı `main`e girince başlar.

## Ortak kaynaklar

- Supabase projesi `cozumkampus` (ref `owvzlonnpiuigrstsean`). Claude oturumlarında Supabase MCP bağlı. Anahtarlar yalnızca `.env`'de; ekibe güvenli kanaldan.
- Yapay zeka: Google Gemini (`gemini-3.5-flash`), OpenAI uyumlu uç nokta; anahtar `.env` `LLM_API_KEY`.
- Demo hesapları (`@demo.cozumkampus.app`, şifre `.env` `DEMO_PASSWORD`): `ogrenci@`, `yonetim@`, `guvenlik@` (kendi ekranı yok), personel `personel@` (Ayşe Yıldız) ve `personel2@` (Mehmet Usta) Yapı İşleri, `bilgi@` (Zeynep Kaya) Bilgi İşlem, `temizlik@` (Hasan Demir) Temizlik. Yeni hesap için önce `allowed_emails`e e-posta eklenmeli.
- GitHub: https://github.com/tunahntopbas/cozum-kampus (private).
- Tasarımlar: `docs/tasarim/*.dc.html` (kaynak: claude.ai tasarım tuvali "Çözüm Kampüs: Ekran Tasarımları"). Arayüz bu dosyalara birebir uyulmalı.

## Yerelde çalıştırma

- Web: `pnpm dev:web` -> http://localhost:3100
- AI: `cd services/ai && uv run uvicorn app.main:app --reload --port 8000`
- `apps/web/.env.local` = kök `.env` içindeki `NEXT_PUBLIC_*` satırları.

## Sonraki planlar

1. Temel ve bildirim hattı (tamam)
2. Harita, bildirim detayı, `/bildirimlerim`, Realtime (tamam)
3. Personel ekranları (tamam)
4. Yönetim paneli (tamam)
5. P1 kalanlar
6. Mobil uygulama
