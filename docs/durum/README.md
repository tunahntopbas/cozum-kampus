# Proje durumu (genel bakış)

Son güncelleme: 2026-10-27

Aktif plan: `docs/superpowers/plans/2026-10-27-temel-ve-bildirim-hatti.md` (Plan 1 / 6)

## Hatlar

| Hat | Dal | Task'lar | Sorumlu | Durum dosyası | Durum |
|---|---|---|---|---|---|
| Temel | `main` | 1 | tunahan | bu dosya | Tamamlandı |
| DB | `hat/db` | 2 | ? | [db.md](db.md) | Başlamadı |
| AI servisi | `hat/ai` | 3, 4, 5 | ? | [ai.md](ai.md) | Başlamadı |
| Web | `hat/web` | 6, 7, 8 | tunahan | [web.md](web.md) | Task 6 tamam, Task 7 sürüyor |
| Birleşme | `hat/entegrasyon` | 9, 10 | herkes | [entegrasyon.md](entegrasyon.md) | Bekliyor (DB, AI, Web bitince) |

## Bağımlılıklar

- DB, AI, Web hatları birbirinden bağımsız; aynı anda başlayabilir.
- Web Task 7'nin elle testi için DB hattının Supabase projesi ve şeması hazır olmalı (birim testleri beklemez).
- Birleşme (Task 9, 10) üç hattın PR'ı `main`e girince başlar.

## Ortak kaynaklar

- Supabase projesi: henüz açılmadı (DB hattı açar, URL ve anahtarları ekibe güvenli kanaldan iletir, depoya yazmaz).
- DeepSeek API anahtarı: AI hattında, `.env` içinde.
- GitHub deposu: henüz yok.

## Sonraki planlar

1. Temel ve bildirim hattı (aktif)
2. Harita, bildirim detayı, `/bildirimlerim`, Realtime
3. Personel ekranları
4. Yönetim paneli
5. P1 kalanlar
6. Mobil uygulama
