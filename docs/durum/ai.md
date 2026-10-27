# Hat: AI servisi

Task'lar: 3, 4, 5
Dal: `hat/ai`
Sorumlu: tunahan

## Son durum

AI hattı (Task 3, 4, 5) kod olarak tamam. Bekleyen tek iş: Task 4 Step 5 gerçek DeepSeek denemesi (anahtar gerekli).

## Sıradaki adım

1. `DEEPSEEK_API_KEY` gelince Task 4 Step 5 (bkz. Engeller).
2. `hat/ai` -> `main` PR aç.
3. Üç hat `main`e girince Task 9 (`docs/durum/entegrasyon.md`).

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 3: uv projesi (Python 3.12), `app/config.py` (kök `.env` okunur), `app/auth.py` (token Supabase `/auth/v1/user` ile doğrulanır, 60 sn önbellek), `app/ratelimit.py`, `/health`, CORS. Testler: `cd services/ai && uv run pytest -q` 9/9.
- 2026-10-27 Task 4: `app/llm/` (Protocol, DeepSeekProvider: 3 deneme, JSON modu açık/kapalı, FakeProvider), `app/privacy.py` (`mask_pii`), `app/storage.py` (yol doğrulama, Storage'dan servis anahtarıyla indirme, 5 MB sınırı, `ai_runs` kaydı, `get_user_role`), `app/fallback.py` (kural tabanlı analiz), `app/prompts/analyze_report.py`, `POST /ai/analyze-report`, `scripts/smoke_deepseek.py`. Testler 52/52.
- 2026-10-27 Task 5: `POST /ai/verify-resolution` (yalnızca `staff`/`admin`, rol `profiles` tablosundan servis anahtarıyla okunur; sonra fotoğrafı kullanıcının kendi klasöründe olmalı; hata/geçersiz çıktıda `ai_pending: true`). Testler 60/60.

## Engeller

- Task 4 Step 5: `DEEPSEEK_API_KEY` kök `.env`'e girilince bir lamba fotoğrafıyla çalıştır: `cd services/ai && uv run python -m scripts.smoke_deepseek foto.jpg "Koridorda lamba yanmıyor"`. JSON modu görselle hata verirse `.env`'e `LLM_JSON_MODE=false` yaz ve sonucu buraya not et.

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Supabase'e ulaşılamazsa 401 yerine 503 dönülür; web istemcisi 5xx'te "analiz bekleniyor" yoluna düşer.
- `Authorization` başlığı `Bearer` değilse 401.
- Model çağrısına toplam süre sınırı eklendi: `LLM_TIMEOUT_S=12` (web istemcisi 15 sn'de vazgeçiyor; sunucu ondan önce kural tabanlı sonuca düşer). OpenAI SDK'nın kendi yeniden denemesi kapalı (`max_retries=0`), denemeler sağlayıcıda.
- JSON modu ayarla açılıp kapanır: `LLM_JSON_MODE` (varsayılan true).
- Model çıktısı doğrulanmadan önce normalize edilir: `unit` her zaman kategoriden (hassas ise `guvenlik`) türetilir, başlık 80 karaktere kırpılır. Böylece yalnızca birim ya da başlık hatası yüzünden yedek analize düşülmez.
- Metin ve fotoğraf ikisi de boşsa 400.
- verify-resolution: önce fotoğrafı öğrencinin klasöründe olduğu için sahiplik değil yalnızca yol biçimi (`<uid>/<dosya>`, `..` yok) kontrol edilir.
- Storage'da dosya yoksa 400.
- Kural tabanlı analiz hassas kelimelerde (taciz, şiddet, intihar...) `is_sensitive=true` ve `guvenlik` birimi verir; tehlikeli kelimelerde (kablo, yangın, duman...) `acil`.
- `ai_runs` kaydında kullanıcı kimliği yok; `input_hash` metin + yol özetidir.
- Ayarlar önce ortam değişkeninden, yoksa depo kökündeki `.env`'den okunur.

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)

- Web: `POST /ai/analyze-report` 400 (boş istek), 403 (başkasının yolu), 413 (3'ten fazla fotoğraf ya da 5 MB üstü), 429 (dakikada 10'dan fazla), 503 (Supabase Auth'a ulaşılamadı) dönebilir. Model hatasında 200 ve `ai_pending: true` döner.
- DB: `ai_runs` tablosuna servis anahtarıyla `kind, model, input_hash, output, latency_ms` yazılıyor.
