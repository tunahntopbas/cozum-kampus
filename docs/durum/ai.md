# Hat: AI servisi

Task'lar: 3, 4, 5
Dal: `hat/ai`
Sorumlu: tunahan

## Son durum

Task 3 tamam. Task 4 sürüyor.

## Sıradaki adım

Task 4 Step 1: test_privacy.py, test_deepseek.py, test_analyze.py başarısız testleri

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 3: uv projesi (Python 3.12), `app/config.py` (kök `.env` okunur), `app/auth.py` (token Supabase `/auth/v1/user` ile doğrulanır, 60 sn önbellek), `app/ratelimit.py`, `/health`, CORS. Testler: `cd services/ai && uv run pytest -q` 9/9.

## Engeller

Yok.

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Supabase'e ulaşılamazsa 401 yerine 503 dönülür; web istemcisi 5xx'te "analiz bekleniyor" yoluna düşer.
- `Authorization` başlığı `Bearer` değilse 401.
- Ayarlar önce ortam değişkeninden, yoksa depo kökündeki `.env`'den okunur.

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)
