# Çözüm Kampüs: Temel ve Bildirim Hattı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo iskeletini kurmak ve demonun omurgası olan akışı uçtan uca çalıştırmak: öğrenci giriş yapar, `/bildir` sayfasında fotoğraf/yazı/ses ile sorun bildirir, FastAPI servisi DeepSeek ile analiz eder, kayıt Supabase'e düşer.

**Architecture:** Tek depo: `apps/web` (Next.js App Router), `services/ai` (FastAPI), `supabase/` (migration + seed). Web, Supabase'e RLS ile doğrudan okur/yazar; yapay zeka çağrıları yalnızca FastAPI üzerinden, kullanıcının Supabase erişim token'ı ile yapılır. FastAPI fotoğrafları URL'den değil Storage yolundan, servis anahtarıyla indirir.

**Tech Stack:** Next.js (App Router, TypeScript, Tailwind v4), Vitest + Testing Library, Supabase (Postgres + PostGIS, Auth, Storage, Realtime), FastAPI + Pydantic v2 + openai SDK (Python 3.12, uv), pytest, ruff, GitHub Actions, Render, Vercel.

**Spec:** `docs/PROJE_REHBERI.md` (Task 1'de kökteki `COZUM_KAMPUS_PROJE_REHBERI.md` buraya taşınır) ve `docs/fikir-raporu.pdf`.

**Bu plan kapsamı dışında (sonraki planlar):**
- Plan 2: `/` harita (MapLibre), bildirim detayı + zaman çizelgesi, `/bildirimlerim`, Realtime durum
- Plan 3: `/personel` iş listesi, çözüm fotoğrafı arayüzü, geçmiş, malzeme
- Plan 4: `/yonetim` KPI, ısı haritası, bildirimler, birimler, kampüs sesi, haftalık özet
- Plan 5: P1 kalanlar (benzer bildirim, öneriler, bildirim merkezi, acil durum, güvenlik kanalı arayüzü)
- Plan 6: Mobil uygulama (web bittikten sonra)

## Paralel hatlar

Task 1 bittikten sonra üç hat aynı anda, ayrı Claude oturumlarında ve ayrı dallarda ilerler. Durum takibi `docs/durum/` altında, kurallar kökteki `CLAUDE.md` içinde.

| Hat | Dal | Task'lar |
|---|---|---|
| DB | `hat/db` | 2 |
| AI servisi | `hat/ai` | 3, 4, 5 |
| Web | `hat/web` | 6, 7, 8 |
| Birleşme | `hat/entegrasyon` | 9, 10 (üç hat `main`e girince) |

Hatlar yalnızca Interfaces bloklarındaki adlar ve biçimler üzerinden konuşur; birinin arayüzü değişirse kendi durum dosyasındaki "Diğer hatlara notlar" bölümüne yazar.

## Global Constraints

- Renk token'ları spec 6. bölümdeki değerlerle birebir: `ink #0F2A5C`, `ink-hover #1B3F85`, `accent #1F5FD6`, `muted #566486`, `tint #E8EFFA`, `tint-2 #EEF3FB`, `hairline #DCE4F0`, `input-border #CBD5E5`, `map-bg #E9EEF5`, `danger #B91C1C`, `danger-hover #991B1B`; durum renkleri işlemde `#FEF3C7/#92400E`, çözüldü `#DCFCE7/#166534`, alındı `#E5E7EB/#374151`.
- Cam panel: `background: rgba(255,255,255,0.72); backdrop-filter: blur(24px) saturate(160%); border: 1px solid rgba(15,42,92,0.12); box-shadow: 0 8px 32px rgba(15,42,92,0.14); border-radius: 16px`; iç öğeler 8 px yarıçap.
- Yazı tipi Geist 400/500/600, sayı ve saatler Geist Mono. İtalik yok. Aralık ölçeği 4/8/12/16/24/32.
- Animasyon yalnızca `transform` ve `opacity`; `prefers-reduced-motion` desteklenir. Her etkileşimli öğede hover, `active:scale-[0.98]`, görünür odak halkası (`accent`).
- Arayüz metinlerinde tire kullanılmaz, sistem mesajları sakin tonda. Üniversite logosu/markası kullanılmaz; logo yer tutucu.
- İkonlar `@phosphor-icons/react`.
- Kategoriler: `aydinlatma, su_tesisat, asansor_erisilebilirlik, internet_ag, temizlik, mobilya, isitma_sogutma, guvenlik, diger`. Aciliyet: `dusuk, orta, acil`.
- Model adı ve taban adres `.env`'den: `LLM_MODEL=deepseek-flash`, `DEEPSEEK_BASE_URL=https://api.deepseek.com`.
- Modele kullanıcı kimliği, öğrenci no, ad, e-posta gönderilmez. Metindeki telefon, TC kimlik no, e-posta maskelenir. Fotoğraf EXIF verisi yüklemeden önce silinir.
- `SUPABASE_SERVICE_ROLE_KEY` ve `DEEPSEEK_API_KEY` yalnızca FastAPI'de; tarayıcıya hiçbir zaman gitmez. `.env` dosyaları git'e girmez.
- Model yanıt vermese bile bildirim kaydı açılır ("Yapay zeka analizi bekleniyor").
- Rota adları spec 5. bölümdeki gibi Türkçe: `/`, `/bildir`, `/bildirimlerim`, `/oneriler`, `/bildirimler`, `/hesap`, `/personel`, `/yonetim`, `/giris`.

## Review Focus

1. **Render uykudayken analiz isteği (~1 dk gecikme):** Öğrenci beklemeden bildirebilmeli. Web istemcisi 15 sn zaman aşımında `ai_pending: true` sonucuna düşer ve gönderim açık kalır. Test: Task 9 `analyzeReport` zaman aşımı testi.
2. **Model boş/bozuk JSON ya da şema dışı değer döndürür (ör. `category: "elektrik"`):** Kural tabanlı varsayılana düşülür, 500 dönmez. Test: Task 4 `test_analyze_falls_back_on_invalid_category`.
3. **Başkasının Storage yolunu analize gönderme:** `image_paths` yalnızca istek sahibinin `{user_id}/` klasöründen olabilir, aksi 403. Test: Task 4 `test_analyze_rejects_foreign_image_path`.
4. **Büyük ya da çok sayıda fotoğraf (API anahtarını tüketir):** En çok 3 görsel, her biri 5 MB; fazlası 413. Kullanıcı başına dakikada 10 analiz, fazlası 429. Test: Task 4 `test_analyze_rejects_too_many_images`, Task 3 `test_rate_limiter_blocks_after_limit`.
5. **Okul dışı e-posta ile kayıt:** Arayüz reddeder, veritabanı tetikleyicisi de reddeder (istemci atlanırsa). Test: Task 7 `isAllowedEmail` testleri; Task 2 doğrulama sorgusu.

---

### Task 1: Depo iskeleti

**Files:**
- Move: `COZUM_KAMPUS_PROJE_REHBERI.md` → `docs/PROJE_REHBERI.md`
- Move: `Yapay Zeka Destekli Kampüs Sorun Bildirim ve Takip Platformu Fikir Raporu.pdf` → `docs/fikir-raporu.pdf`
- Create: `.gitignore`, `.env.example`, `README.md`, `pnpm-workspace.yaml`, `package.json` (kök)

**Interfaces:**
- Produces: dizin yapısı spec 10. bölümdeki gibi; kök `package.json` betikleri `dev:web`, `test:web` (`pnpm --filter web ...`).

- [x] **Step 1:** `git init -b main` ve dosyaları taşı (`git mv` değil, henüz commit yok; `mv`).
- [x] **Step 2:** `.gitignore`: `node_modules/`, `.next/`, `.env`, `.env.local`, `.venv/`, `__pycache__/`, `.pytest_cache/`, `.ruff_cache/`, `supabase/.temp/`, `.DS_Store`.
- [x] **Step 3:** `.env.example`: spec 10. bölümdeki değişken listesi birebir, ek olarak `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=ogr.sakarya.edu.tr,sakarya.edu.tr` ve `AI_RATE_LIMIT_PER_MIN=10`. Spec'teki `SUPABASE_JWT_SECRET` çıkarılır (Task 3 token'ı Supabase Auth'a sorarak doğrular).
- [x] **Step 4:** `pnpm-workspace.yaml` (`packages: ["apps/*"]`), README'de kurulum: Supabase projesi aç, `.env` doldur, `pnpm dev:web`, `cd services/ai && uv run uvicorn app.main:app --reload`.
- [x] **Step 5:** Doğrula: `git status` yalnızca yukarıdaki dosyaları gösterir, `.env` yok.
- [x] **Step 6:** Commit: `chore: initialize monorepo skeleton and move docs`

---

### Task 2: Supabase şeması, RLS, seed

**Ön koşul (kullanıcı yapar):** supabase.com'da proje aç (bölge: Frankfurt), Settings > API'den URL, anon ve service_role anahtarlarını `.env`'e yaz. Auth > Providers > Email açık, "Confirm email" OTP ile.

**Files:**
- Create: `supabase/config.toml` (`npx supabase init`)
- Create: `supabase/migrations/20261027000001_init.sql`
- Create: `supabase/migrations/20261027000002_rls.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/tests/rls_check.sql`

**Interfaces:**
- Produces (sonraki tüm task'lar kullanır):
  - Tablolar: spec 8. bölümdeki şema birebir, ek tablo `allowed_emails (email text primary key)`.
  - `units.slug` değerleri: `yapi_isleri`, `bilgi_islem`, `temizlik`, `yemekhane`, `guvenlik`.
  - SQL fonksiyonları (security definer, `search_path = public`): `auth_role() returns user_role`, `auth_unit() returns bigint`, `can_read_report(rid bigint) returns boolean`.
  - Görünüm `public_reports`: `reports` sütunları, `reporter_id` yerine `case when is_anonymous then null else reporter_id end as reporter_id`, ayrıca `st_y(location::geometry) as lat`, `st_x(location::geometry) as lng`; `where is_hidden = false and parent_report_id is null`.
  - Storage bucket `report-media` (private), yol biçimi `{auth.uid()}/{uuid}.jpg`.
  - Realtime yayını: `reports`, `report_events`, `notifications`.

- [x] **Step 1:** `npx supabase init`, `npx supabase link --project-ref <ref>`.
- [x] **Step 2:** `..._init.sql`: spec 8. bölüm SQL'i birebir + `allowed_emails` + `alter publication supabase_realtime add table reports, report_events, notifications;`.
- [x] **Step 3:** Aynı dosyada `handle_new_user()` tetikleyicisi (`after insert on auth.users`): e-posta alan adı `ogr.sakarya.edu.tr` ya da `sakarya.edu.tr` değilse ve `allowed_emails` içinde yoksa `raise exception 'Yalnızca okul e-postası ile kayıt olunabilir'`; uygunsa `profiles(id, full_name)` satırı ekler (`raw_user_meta_data->>'full_name'`).
- [x] **Step 4:** `..._rls.sql`: tüm tablolarda RLS aç. İlkeler:
  - `units`, `buildings`, `places`: `anon` ve `authenticated` okur.
  - `profiles`: kendi satırını okur/günceller, `role` ve `unit_id` değiştiremez (`with check (role = auth_role() and unit_id is not distinct from auth_unit())`); `admin` hepsini okur.
  - `reports`: `insert` `reporter_id = auth.uid()`; `select` kendi kaydı ya da `auth_role() = 'admin'` ya da (`staff` ve `unit_id = auth_unit()`); `update` aynı kural, öğrenci yalnızca kendi kaydını.
  - `public_reports` görünümü: `grant select to authenticated`.
  - `report_media`, `report_events`: `select using (can_read_report(report_id))`; `insert with check (can_read_report(report_id))`, `report_events` için ek olarak `actor_id = auth.uid()`.
  - `security_reports`: `insert` her `authenticated`, `select` yalnızca `auth_role() = 'security'`.
  - `notifications`, `notification_prefs`: yalnızca `user_id = auth.uid()`.
  - `ai_runs`, `allowed_emails`, `moderation_flags`: istemciye ilke yok (yalnızca servis anahtarı).
  - Storage `report-media`: `insert` `(storage.foldername(name))[1] = auth.uid()::text`; `select` `authenticated`.
  - `can_read_report`: sahibi, admin, aynı birim personeli ya da `is_hidden = false`.
- [x] **Step 5:** `seed.sql`: 5 birim; Esentepe Kampüsü çevresinde 8 bina (merkez yaklaşık `40.7425, 30.3330`; adlar ve koordinatlar yer tutucu, spec 14. bölüm açık işi), her binada 2 `places` satırı (`qr_code` ör. `M1-K2-WC`); demo hesaplar için `allowed_emails`: `personel@demo.cozumkampus.app`, `yonetim@demo.cozumkampus.app`, `guvenlik@demo.cozumkampus.app`; 12 kurgusal bildirim (karışık kategori/durum, `reporter_id` null).
- [x] **Step 6:** `npx supabase db push` ve `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`. Beklenen: hata yok.
- [x] **Step 7:** `supabase/tests/rls_check.sql` yaz ve SQL editörde çalıştır. Beklenen çıktılar yorum satırında:
  ```sql
  select count(*) from units;            -- 5
  select count(*) from public_reports;   -- 12
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
  select count(*) from reports;          -- 0 (başkasının kaydı görünmez)
  select count(*) from security_reports; -- 0
  ```
  Ayrıca Auth panelinden `deneme@gmail.com` ile kullanıcı oluşturmayı dene. Beklenen: "Database error saving new user".
- [x] **Step 8:** (SQL ile yapıldı, bkz. db.md) Panelden 3 demo hesabı oluştur, SQL ile `profiles.role` ve `unit_id` ata (`staff` → `yapi_isleri`).
- [x] **Step 9:** Commit: `feat(db): add schema, RLS policies and demo seed`

---

### Task 3: FastAPI iskeleti, yapılandırma, kimlik doğrulama, hız sınırı

**Files:**
- Create: `services/ai/pyproject.toml` (`uv init --python 3.12`), `services/ai/app/__init__.py`
- Create: `services/ai/app/main.py`, `services/ai/app/config.py`, `services/ai/app/auth.py`, `services/ai/app/ratelimit.py`
- Test: `services/ai/tests/conftest.py`, `services/ai/tests/test_health.py`, `services/ai/tests/test_auth.py`, `services/ai/tests/test_ratelimit.py`

**Interfaces:**
- Produces:
  - `app.config.Settings` (pydantic-settings): `supabase_url: str`, `supabase_service_role_key: str`, `supabase_anon_key: str`, `deepseek_api_key: str`, `deepseek_base_url: str = "https://api.deepseek.com"`, `llm_model: str = "deepseek-flash"`, `allowed_origin: str = "http://localhost:3000"`, `ai_rate_limit_per_min: int = 10`; `get_settings()` `lru_cache` ile.
  - `app.auth.CurrentUser` (pydantic): `id: str`, `email: str | None`.
  - `app.auth.get_current_user(authorization: str = Header(...)) -> CurrentUser`: `GET {supabase_url}/auth/v1/user` (headers `apikey`, `Authorization`), 200 değilse `HTTPException(401)`. Sonuç token'ın sha256'sı ile 60 sn önbellekte.
  - `app.ratelimit.RateLimiter(limit: int, window_s: float = 60, clock=time.monotonic)` ve `check(key: str) -> None` (aşımda `HTTPException(429)`).
  - `app.main.app`: CORS yalnızca `allowed_origin`; `GET /health` → `{"status": "ok"}`.

- [ ] **Step 1:** `uv init --python 3.12 services/ai`; `uv add fastapi "uvicorn[standard]" openai pydantic-settings httpx`; `uv add --dev pytest pytest-asyncio ruff`. `pyproject.toml` içinde `[tool.pytest.ini_options] asyncio_mode = "auto"`.
- [ ] **Step 2: Failing tests**
  ```python
  # tests/test_health.py
  def test_health(client):
      assert client.get("/health").json() == {"status": "ok"}

  # tests/test_ratelimit.py
  def test_rate_limiter_blocks_after_limit():
      t = [0.0]
      rl = RateLimiter(limit=2, window_s=60, clock=lambda: t[0])
      rl.check("u1"); rl.check("u1")
      with pytest.raises(HTTPException) as e: rl.check("u1")
      assert e.value.status_code == 429
      rl.check("u2")                     # başka kullanıcı etkilenmez
      t[0] = 61; rl.check("u1")          # pencere geçince açılır

  # tests/test_auth.py  (httpx.MockTransport ile Supabase taklidi)
  async def test_get_current_user_returns_user_on_200(): ...   # id == "u-1"
  async def test_get_current_user_raises_401_on_bad_token(): ... # status_code == 401
  ```
  `conftest.py`: ortam değişkenlerini sahte değerlerle ayarlayan ve `TestClient(app)` döndüren `client` fixture'ı; `app.dependency_overrides[get_current_user] = lambda: CurrentUser(id="u-1", email="a@ogr.sakarya.edu.tr")`.
- [ ] **Step 3:** `cd services/ai && uv run pytest -q` → FAIL (modüller yok).
- [ ] **Step 4:** Modülleri yaz. `auth.py` httpx istemcisini modül düzeyinde `get_http_client()` ile verir ki testte değiştirilebilsin.
- [ ] **Step 5:** `uv run pytest -q && uv run ruff check .` → PASS.
- [ ] **Step 6:** Commit: `feat(ai): FastAPI skeleton with health, auth and rate limiting`

---

### Task 4: LLM sağlayıcısı ve `POST /ai/analyze-report`

**Files:**
- Create: `services/ai/app/llm/base.py`, `services/ai/app/llm/deepseek.py`, `services/ai/app/llm/fake.py`, `services/ai/app/llm/__init__.py` (`get_llm()`)
- Create: `services/ai/app/privacy.py`, `services/ai/app/storage.py`
- Create: `services/ai/app/schemas/report.py`, `services/ai/app/prompts/analyze_report.py`, `services/ai/app/fallback.py`
- Create: `services/ai/app/routers/analyze.py`
- Create: `services/ai/scripts/smoke_deepseek.py`
- Test: `services/ai/tests/test_privacy.py`, `services/ai/tests/test_deepseek.py`, `services/ai/tests/test_analyze.py`, `services/ai/tests/fixtures/lamp.jpg`

**Interfaces:**
- Consumes: Task 3 `get_settings`, `get_current_user`, `CurrentUser`, `RateLimiter`.
- Produces:
  - `LLMProvider` Protocol (spec 7.2): `async complete_json(*, system: str, user_text: str, image_b64: list[str] | None = None, schema_hint: str) -> dict`.
  - `DeepSeekProvider(client: AsyncOpenAI, model: str, use_json_mode: bool = True)`: 3 deneme, boş ya da geçersiz JSON'da yeniden dener, sonra `LLMError`. JSON modu kapalıyken yanıttaki ilk `{` ile son `}` arası ayıklanır.
  - `FakeProvider(responses: list[dict | Exception])`: sırayla döndürür, testler için.
  - `get_llm() -> LLMProvider` (FastAPI dependency).
  - `mask_pii(text: str) -> str`: e-posta → `[e-posta]`, TR telefon (`05xx...`, `+90...`, boşluklu) → `[telefon]`, 11 haneli TC no → `[tc]`.
  - `fetch_images(paths: list[str], user_id: str) -> list[str]` (base64): her yol `f"{user_id}/"` ile başlamalı (aksi 403), `report-media` bucket'ından servis anahtarıyla indirir, 5 MB üstü 413.
  - Şemalar:
    ```python
    Category = Literal["aydinlatma","su_tesisat","asansor_erisilebilirlik","internet_ag","temizlik","mobilya","isitma_sogutma","guvenlik","diger"]
    Urgency = Literal["dusuk","orta","acil"]
    UnitSlug = Literal["yapi_isleri","bilgi_islem","temizlik","yemekhane","guvenlik"]
    class Moderation(BaseModel): ok: bool; reasons: list[str] = []
    class AnalyzeRequest(BaseModel):
        text: str = Field("", max_length=2000)
        image_paths: list[str] = Field(default_factory=list)
        lat: float | None = None; lng: float | None = None
        building_name: str | None = None
    class ReportAnalysis(BaseModel):
        title: str = Field(max_length=80); category: Category; urgency: Urgency; unit: UnitSlug
        summary: str; materials: list[str] = []; is_sensitive: bool = False
        moderation: Moderation; confidence: float = Field(ge=0, le=1)
        ai_pending: bool = False
    ```
    `image_paths` 3'ten fazlaysa 422 yerine 413 dönmesi için sayı kontrolü şemada değil router'da yapılır.
  - `CATEGORY_TO_UNIT: dict[str, str]`: `internet_ag→bilgi_islem`, `temizlik→temizlik`, `guvenlik→guvenlik`, diğer hepsi `yapi_isleri`.
  - `rule_based_analysis(text: str) -> ReportAnalysis`: anahtar kelime eşleşmesi (`lamba|ışık|aydınlat → aydinlatma`, `su|musluk|sızıntı|tuvalet → su_tesisat`, `asansör|rampa → asansor_erisilebilirlik`, `wifi|wi-fi|internet|ağ → internet_ag`, `çöp|kirli|temiz → temizlik`, `sıra|masa|sandalye → mobilya`, `kalorifer|klima|ısıtma|soğuk → isitma_sogutma`, `kablo|yangın|duman|mahsur → urgency=acil`), `ai_pending=True`, `confidence=0`, `moderation.ok=True`, başlık metnin ilk 60 karakteri ya da `"Yeni bildirim"`.
  - `POST /ai/analyze-report` → `ReportAnalysis`. Akış: hız sınırı (`user.id`), görsel sayısı > 3 ise 413, `fetch_images`, `mask_pii(text)`, LLM çağrısı, `ReportAnalysis.model_validate`; `LLMError` ya da `ValidationError` olursa `rule_based_analysis`. Model `unit` değeri yerine her zaman `CATEGORY_TO_UNIT[category]` kullanılır, `is_sensitive=True` ise `unit="guvenlik"`. Her çağrı `ai_runs` tablosuna yazılır (`kind="analyze_report"`, `input_hash`, `latency_ms`), yazma hatası yanıtı bozmaz.

- [ ] **Step 1: Failing tests**
  ```python
  # test_privacy.py
  def test_mask_pii():
      s = mask_pii("Ara 0532 123 45 67, mail a.b@x.com, TC 12345678901")
      assert "[telefon]" in s and "[e-posta]" in s and "[tc]" in s
      assert "0532" not in s and "a.b@x.com" not in s

  # test_deepseek.py  (AsyncOpenAI yerine sahte istemci: chat.completions.create sırayla içerik döndürür)
  async def test_retries_on_empty_then_parses(): ...          # ["", "{\"a\":1}"] -> {"a": 1}
  async def test_raises_after_three_invalid(): ...             # ["x","y","z"] -> LLMError
  async def test_extracts_json_when_json_mode_off(): ...       # "Sonuç: {\"a\":1} bitti" -> {"a": 1}

  # test_analyze.py  (get_llm -> FakeProvider, fetch_images -> sahte)
  VALID = {"title":"Koridor lambası yanmıyor","category":"aydinlatma","urgency":"orta","unit":"yapi_isleri",
           "summary":"...","materials":["LED tüp 18 W"],"is_sensitive":False,
           "moderation":{"ok":True,"reasons":[]},"confidence":0.94}
  def test_analyze_returns_model_output(client, fake_llm): ...           # category == "aydinlatma", ai_pending is False
  def test_analyze_falls_back_on_invalid_category(client, fake_llm): ... # model {"category":"elektrik",...}; 200, ai_pending True
  def test_analyze_falls_back_on_llm_error(client, fake_llm): ...        # "musluk akıyor" -> category "su_tesisat", ai_pending True
  def test_analyze_sensitive_routes_to_guvenlik(client, fake_llm): ...   # is_sensitive True -> unit "guvenlik"
  def test_analyze_overrides_model_unit(client, fake_llm): ...           # category internet_ag, unit yapi_isleri -> unit "bilgi_islem"
  def test_analyze_masks_pii_before_llm(client, fake_llm): ...           # FakeProvider son çağrının user_text'inde "0532" yok
  def test_analyze_rejects_foreign_image_path(client): ...               # image_paths ["baska-kullanici/x.jpg"] -> 403
  def test_analyze_rejects_too_many_images(client): ...                  # 4 yol -> 413
  ```
- [ ] **Step 2:** `uv run pytest -q` → yeni testler FAIL.
- [ ] **Step 3:** Modülleri yaz. Sistem komutu (`prompts/analyze_report.py`, Türkçe) spec 7.3'teki kuralları açıkça içerir: yalnızca JSON; kategori ve aciliyet listeleri; hakaret/küfür ve kişi odaklı görüntüler `moderation.ok=false`; kampüs sorunuyla ilgisiz fotoğraf `moderation.reasons` içinde; taciz, şiddet, intihar riski `is_sensitive=true`; elektrik, yangın, yaralanma, mahsur kalma riski `acil`. `schema_hint` spec 7.3 örnek JSON'u.
- [ ] **Step 4:** `uv run pytest -q && uv run ruff check .` → PASS.
- [ ] **Step 5: Gerçek model denemesi (spec 14. bölüm açık işi).** `scripts/smoke_deepseek.py`: `tests/fixtures/lamp.jpg` ile önce `use_json_mode=True`, sonra `False` çağırır, her birinin sonucunu ve süresini basar. Çalıştır: `uv run python scripts/smoke_deepseek.py`. Beklenen: en az biri geçerli `ReportAnalysis`. JSON modu görselle 400 verirse `get_llm()` içinde `use_json_mode=False` sabitle ve sonucu README'ye bir satır olarak yaz.
- [ ] **Step 6:** Commit: `feat(ai): analyze-report endpoint with DeepSeek provider and rule-based fallback`

---

### Task 5: `POST /ai/verify-resolution`

**Files:**
- Create: `services/ai/app/schemas/resolution.py`, `services/ai/app/prompts/verify_resolution.py`, `services/ai/app/routers/verify.py`
- Test: `services/ai/tests/test_verify.py`

**Interfaces:**
- Consumes: Task 4 `get_llm`, `fetch_images`, `LLMError`; Task 3 `get_current_user`, `RateLimiter`.
- Produces:
  - `VerifyRequest`: `before_path: str`, `after_path: str`, `category: str | None = None`.
  - `VerifyResult`: `resolved: bool`, `confidence: float (0..1)`, `note: str`, `ai_pending: bool = False`.
  - `POST /ai/verify-resolution` → `VerifyResult`. `before_path` öğrencinin klasöründe olduğundan sahiplik kontrolü yerine Supabase'den kullanıcının rolü okunur: `staff` ya da `admin` değilse 403. `after_path` kullanıcının kendi klasöründe olmalı. Hata ya da geçersiz yanıtta `VerifyResult(resolved=False, confidence=0, note="Doğrulama şu an yapılamadı, kayıt elle incelenecek.", ai_pending=True)`.
  - `get_user_role(user_id: str) -> str` `app/storage.py` içinde (servis anahtarıyla `profiles` okur), testte override edilir.

- [ ] **Step 1: Failing tests**
  ```python
  def test_verify_returns_model_result(client, fake_llm): ...      # {"resolved":true,"confidence":0.9,"note":"Lamba yanıyor"} -> resolved True
  def test_verify_forbidden_for_student(client): ...               # get_user_role -> "student" -> 403
  def test_verify_falls_back_on_llm_error(client, fake_llm): ...   # ai_pending True, resolved False
  ```
- [ ] **Step 2:** `uv run pytest tests/test_verify.py -q` → FAIL.
- [ ] **Step 3:** Yaz. Görsel sırası: önce, sonra; komut ikisini bu sırayla tanıtır.
- [ ] **Step 4:** `uv run pytest -q` → PASS.
- [ ] **Step 5:** Commit: `feat(ai): verify-resolution endpoint`

---

### Task 6: Next.js iskeleti, tasarım token'ları, ortak bileşenler

**Files:**
- Create: `apps/web/` (`pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm`)
- Modify: `apps/web/app/globals.css` (Tailwind v4 `@theme` token'ları), `apps/web/app/layout.tsx` (Geist fontları, `lang="tr"`)
- Create: `apps/web/components/ui/{Glass.tsx,Button.tsx,StatusPill.tsx,Switch.tsx,Logo.tsx}`
- Create: `apps/web/lib/status.ts`
- Create: `apps/web/app/(ogrenci)/layout.tsx` (üst menü), yer tutucu sayfalar `app/(ogrenci)/{page,bildirimlerim/page,oneriler/page,bildirimler/page,hesap/page}.tsx`, `app/personel/page.tsx`, `app/yonetim/page.tsx`
- Create: `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts`
- Test: `apps/web/lib/status.test.ts`, `apps/web/components/ui/StatusPill.test.tsx`

**Interfaces:**
- Produces:
  - Tailwind renk sınıfları Global Constraints'teki token adlarıyla (`bg-ink`, `text-muted`, `border-hairline`, `bg-map-bg`, `bg-tint` ...). Sınıf `.glass` cam panel stilini uygular.
  - `ReportStatus` tipi: `'alindi'|'yonlendirildi'|'atandi'|'islemde'|'cozuldu'|'yeniden_acildi'|'geri_cekildi'`.
  - `statusMeta(s: ReportStatus): { label: string; tone: 'alindi'|'islemde'|'cozuldu' }`. Etiketler: `Alındı, Yönlendirildi, Atandı, İşlemde, Çözüldü, Yeniden açıldı, Geri çekildi`. Ton: `alindi, yonlendirildi, geri_cekildi → alindi`; `atandi, islemde, yeniden_acildi → islemde`; `cozuldu → cozuldu`.
  - `<StatusPill status={ReportStatus} />`, `<Glass className? />`, `<Button variant="primary"|"secondary"|"danger" />`, `<Switch checked onChange label />` (`role="switch"`, `aria-checked`).

- [ ] **Step 1:** Next.js'i oluştur; `pnpm add @supabase/supabase-js @supabase/ssr @phosphor-icons/react geist`; `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`. `package.json`'a `"test": "vitest run"`.
- [ ] **Step 2: Failing tests**
  ```ts
  // lib/status.test.ts
  expect(statusMeta('islemde')).toEqual({ label: 'İşlemde', tone: 'islemde' })
  expect(statusMeta('yonlendirildi').tone).toBe('alindi')
  expect(statusMeta('cozuldu').label).toBe('Çözüldü')
  // StatusPill.test.tsx
  render(<StatusPill status="cozuldu" />); expect(screen.getByText('Çözüldü')).toBeInTheDocument()
  ```
- [ ] **Step 3:** `pnpm --filter web test` → FAIL.
- [ ] **Step 4:** Token'ları, bileşenleri ve yer tutucu sayfaları yaz. Üst menü: Harita `/`, Bildirimlerim, Öneriler, sağda `Bildir` ana butonu ve zil (`/bildirimler`), profil (`/hesap`). Yer tutucu sayfalar yalnızca başlık ve "Bu ekran yakında" metni.
- [ ] **Step 5:** `pnpm --filter web test && pnpm --filter web lint && pnpm --filter web exec tsc --noEmit` → PASS. `pnpm dev:web` ile `/` açılır, menü bağlantıları 404 vermez.
- [ ] **Step 6:** Commit: `feat(web): Next.js skeleton with design tokens and base UI components`

---

### Task 7: Supabase istemcileri, giriş, rol korumalı rotalar

**Files:**
- Create: `apps/web/lib/supabase/{client.ts,server.ts}`, `apps/web/middleware.ts`, `apps/web/lib/auth.ts`
- Create: `apps/web/app/giris/page.tsx`, `apps/web/app/auth/callback/route.ts`
- Modify: `apps/web/app/(ogrenci)/hesap/page.tsx` (profil bilgisi + çıkış)
- Test: `apps/web/lib/auth.test.ts`

**Interfaces:**
- Consumes: Task 2 `profiles.role`, Task 6 bileşenleri.
- Produces:
  - `createClient()` (tarayıcı, `@supabase/ssr` `createBrowserClient`) ve `createServerClient()` (sunucu, cookies).
  - `type Role = 'student'|'staff'|'admin'|'security'`.
  - `isAllowedEmail(email: string, domains = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS): boolean`: küçük harfe çevirir, tam alan adı eşleşmesi (alt alan adı sahtekârlığı olmaz).
  - `requiredRole(pathname: string): Role[] | null`: `/personel*` → `['staff','admin']`, `/yonetim*` → `['admin']`, `/giris`, `/auth/*` → `null` (herkese açık), diğerleri → `['student','staff','admin','security']`.
  - `middleware.ts`: oturum yoksa `/giris?next=<path>`; rol uymuyorsa `/`.

- [ ] **Step 1: Failing tests**
  ```ts
  const D = 'ogr.sakarya.edu.tr,sakarya.edu.tr'
  expect(isAllowedEmail('Ali@OGR.sakarya.edu.tr', D)).toBe(true)
  expect(isAllowedEmail('a@sakarya.edu.tr', D)).toBe(true)
  expect(isAllowedEmail('a@gmail.com', D)).toBe(false)
  expect(isAllowedEmail('a@evilsakarya.edu.tr', D)).toBe(false)
  expect(isAllowedEmail('a@sakarya.edu.tr.evil.com', D)).toBe(false)
  expect(requiredRole('/yonetim/birimler')).toEqual(['admin'])
  expect(requiredRole('/personel')).toEqual(['staff','admin'])
  expect(requiredRole('/giris')).toBeNull()
  ```
- [ ] **Step 2:** `pnpm --filter web test` → FAIL.
- [ ] **Step 3:** Yaz. `/giris`: e-posta alanı, `isAllowedEmail` başarısızsa "Okul e-posta adresinle giriş yapabilirsin." ; `signInWithOtp({ email, options: { emailRedirectTo: <origin>/auth/callback?next=... } })`; ardından 6 haneli kod alanı (`verifyOtp`, type `email`). Demo hesapları (`demo.cozumkampus.app`) arayüz kontrolünü geçemez; onlar için `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`'e yerelde `demo.cozumkampus.app` eklenir (veritabanı tarafı `allowed_emails` ile zaten izinli).
- [ ] **Step 4:** Testler PASS. Elle doğrula: okul e-postasıyla kod gelir, giriş sonrası `/hesap` adı gösterir; öğrenci hesabıyla `/yonetim` → `/`'e döner; çıkışta `/giris`.
- [ ] **Step 5:** Commit: `feat(web): Supabase auth with school email OTP and role-gated routes`

---

### Task 8: Fotoğraf hazırlama ve yükleme

**Files:**
- Create: `apps/web/lib/image.ts`, `apps/web/lib/upload.ts`
- Test: `apps/web/lib/image.test.ts`

**Interfaces:**
- Consumes: Task 7 `createClient`, Task 2 bucket `report-media`.
- Produces:
  - `fitWithin(w: number, h: number, max = 1600): { width: number; height: number }`: oranı korur, büyütmez.
  - `prepareImage(file: File): Promise<Blob>`: `createImageBitmap(file, { imageOrientation: 'from-image' })` → canvas → `toBlob('image/jpeg', 0.82)`. Yeniden kodlama EXIF'i (GPS dahil) siler. Kabul edilen türler JPEG, PNG, WebP, HEIC dışı; desteklenmeyen türde `Error('Bu dosya türü desteklenmiyor')`.
  - `uploadReportImage(userId: string, blob: Blob): Promise<string>`: yol `${userId}/${crypto.randomUUID()}.jpg`, döndürür yolu.

- [ ] **Step 1: Failing tests**
  ```ts
  expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 })
  expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  ```
- [ ] **Step 2:** FAIL → yaz → PASS (`pnpm --filter web test`).
- [ ] **Step 3:** Elle doğrula (Task 9 sayfasında): GPS'li bir iPhone fotoğrafı yükle, Storage'dan indir, `exiftool <dosya>` çıktısında GPS satırı yok.
- [ ] **Step 4:** Commit: `feat(web): client-side image downscale, EXIF strip and upload`

---

### Task 9: `/bildir` sayfası uçtan uca

**Files:**
- Create: `apps/web/lib/ai.ts`, `apps/web/lib/report.ts`, `apps/web/lib/speech.ts`
- Create: `apps/web/app/(ogrenci)/bildir/page.tsx`, `apps/web/components/report/{InputTabs.tsx,PhotoPicker.tsx,LocationPicker.tsx,AnalysisPanel.tsx}`
- Test: `apps/web/lib/ai.test.ts`, `apps/web/lib/report.test.ts`

**Interfaces:**
- Consumes: Task 4 `ReportAnalysis` JSON biçimi; Task 6 bileşenleri; Task 7 istemcileri; Task 8 `prepareImage`, `uploadReportImage`.
- Produces:
  - `type ReportAnalysis` (TS, Task 4 şemasıyla aynı alanlar).
  - `analyzeReport(input: { text: string; imagePaths: string[]; lat?: number; lng?: number; buildingName?: string }, accessToken: string, opts?: { timeoutMs?: number; fetchImpl?: typeof fetch }): Promise<ReportAnalysis>`: `POST ${NEXT_PUBLIC_AI_API_URL}/ai/analyze-report`, varsayılan zaman aşımı 15000 ms. Ağ hatası, zaman aşımı ya da 5xx'te `pendingAnalysis(text)` döner (`ai_pending: true`, `category: 'diger'`, `urgency: 'orta'`, `unit: 'yapi_isleri'`, başlık metnin ilk 60 karakteri ya da `'Yeni bildirim'`). 403/413/429 hata olarak fırlatılır (`AiRequestError` ile `status`).
  - `type ReportForm = { text: string; imagePaths: string[]; isAnonymous: boolean; buildingId: number | null; placeId: number | null; floor: number | null; lat: number | null; lng: number | null }`.
  - `buildReportInsert(form: ReportForm, a: ReportAnalysis, userId: string, unitIdBySlug: Record<string, number>)`: `reports` satırı döndürür. `status = a.ai_pending ? 'alindi' : 'yonlendirildi'`; `location` `SRID=4326;POINT(lng lat)` (ikisi de varsa, yoksa `null`); `ai_summary`, `ai_confidence`, `ai_materials` analizden; `description = form.text`.
  - `canSubmit(a: ReportAnalysis | null, form: ReportForm): { ok: true } | { ok: false; message: string }`: metin ve fotoğraf ikisi de boşsa "Bir fotoğraf ya da kısa bir açıklama ekle."; konum hiç yoksa (`buildingId`, `lat` ikisi de null) "Sorunun nerede olduğunu seç."; `a?.moderation.ok === false` ise "Bu içerik paylaşılamıyor. Fotoğrafın ve açıklamanın kampüsteki sorunu gösterdiğinden emin ol.".
  - `startDictation(onText: (t: string) => void): (() => void) | null`: `SpeechRecognition`/`webkitSpeechRecognition`, `lang='tr-TR'`; desteklenmiyorsa `null`.
  - Gönderim: `reports` insert → `report_media` (`kind: 'once'`) satırları → `report_events` (`type: 'olusturuldu'`, `payload: { category, urgency, ai_pending }`). Başarıda `/bildirimlerim?yeni=<id>`'e gider.

- [ ] **Step 1: Failing tests**
  ```ts
  // ai.test.ts
  it('returns pending analysis on timeout', async () => {
    const hang = () => new Promise<Response>(() => {})
    const r = await analyzeReport({ text: 'Lamba yanmıyor', imagePaths: [] }, 't', { timeoutMs: 10, fetchImpl: hang as any })
    expect(r.ai_pending).toBe(true); expect(r.title).toBe('Lamba yanmıyor')
  })
  it('returns pending analysis on 503', ...)          // fetchImpl -> new Response('', { status: 503 })
  it('throws AiRequestError on 429', ...)            // status 429 -> rejects, err.status === 429
  it('sends bearer token', ...)                       // headers Authorization === 'Bearer t'
  // report.test.ts
  it('marks pending analysis as alindi', ...)         // buildReportInsert(...).status === 'alindi'
  it('routes analysed report', ...)                   // ai_pending false -> status 'yonlendirildi', unit_id === map['yapi_isleri']
  it('builds WKT location', ...)                      // lat 40.74, lng 30.33 -> 'SRID=4326;POINT(30.33 40.74)'
  it('blocks moderated content', ...)                 // canSubmit({..moderation:{ok:false}}) -> ok false
  it('requires photo or text', ...)                   // boş form -> ok false, message 'Bir fotoğraf ya da kısa bir açıklama ekle.'
  ```
- [ ] **Step 2:** FAIL → `lib/ai.ts`, `lib/report.ts`, `lib/speech.ts` yaz → PASS.
- [ ] **Step 3: Sayfa.** Düzen (1440 px tasarım): solda form (cam panel), sağda "Yapay zeka analizi" paneli.
  - Sekmeler: Fotoğraf / Yazı / Ses. Fotoğraf: en çok 3, önizleme, kaldırma. Yazı: açıklama alanı. Ses: mikrofon butonu `startDictation`, `null` ise "Tarayıcın sesli anlatımı desteklemiyor, yazarak devam edebilirsin."
  - Konum: `?yer=<qr_kodu>` varsa `places` + `buildings`'ten doldurulur ve kilitlenir ("Konum QR koddan alındı", değiştir bağlantısı); yoksa bina listesi + kat seçimi, "Konumumu kullan" (`navigator.geolocation`).
  - Anonim anahtarı (`Switch`): "Adım birimlere gösterilmesin".
  - Analiz tetikleme: fotoğraf yüklenince ya da metin yazımı 800 ms durunca `analyzeReport`. Panel: başlık, kategori, aciliyet, birim adı, özet, malzeme tahmini, güven oranı (Geist Mono). `ai_pending` ise "Yapay zeka analizi bekleniyor. Bildirimini yine de gönderebilirsin."
  - `is_sensitive` ise panelde sakin bir not: "Bu bildirim gizlilikle güvenlik birimine iletilecek."
  - Acil durum butonu (danger) bu planda yalnızca `tel:` bağlantısı (kampüs güvenlik numarası `.env`'de `NEXT_PUBLIC_SECURITY_PHONE`); konumlu uyarı Plan 5.
  - Gönder: `canSubmit` başarısızsa mesajı formun altında göster; başarılıysa kayıt akışı.
- [ ] **Step 4:** `pnpm --filter web test && pnpm --filter web exec tsc --noEmit` → PASS.
- [ ] **Step 5: Uçtan uca elle doğrulama** (FastAPI `uv run uvicorn app.main:app --port 8000`, web `pnpm dev:web`, `.env.local` içinde `NEXT_PUBLIC_AI_API_URL=http://localhost:8000`):
  1. Öğrenci girişi → `/bildir` → lamba fotoğrafı. Beklenen: panel `aydinlatma`, birim Yapı İşleri.
  2. Gönder. Beklenen: Supabase'de `reports` satırı `status=yonlendirildi`, `report_media` 1 satır, `report_events` 1 satır.
  3. FastAPI'yi durdur, yalnızca metinle bildir. Beklenen: 15 sn içinde "analiz bekleniyor", gönderim çalışır, `status=alindi`.
  4. `/bildir?yer=M1-K2-WC`. Beklenen: konum dolu ve kilitli.
- [ ] **Step 6:** Commit: `feat(web): report submission flow with AI analysis`

---

### Task 10: Dağıtım ve CI

**Ön koşul (kullanıcı yapar):** GitHub deposu oluştur ve `git remote add origin ...`; Render ve Vercel hesaplarını GitHub'a bağla.

**Files:**
- Create: `services/ai/Dockerfile`, `render.yaml`
- Create: `.github/workflows/web.yml`, `.github/workflows/ai.yml`

**Interfaces:**
- Consumes: Task 3 `/health`, `ALLOWED_ORIGIN`.
- Produces: Render servisi `cozum-kampus-ai` (`healthCheckPath: /health`, ortam değişkenleri `sync: false`); Vercel projesi kök dizini `apps/web`.

- [ ] **Step 1:** `Dockerfile`: `python:3.12-slim`, uv ile `uv sync --frozen --no-dev`, `CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`. Yerelde dene: `docker build -t cozum-ai services/ai && docker run -p 8000:8000 --env-file .env cozum-ai`, `curl localhost:8000/health` → `{"status":"ok"}`.
- [ ] **Step 2:** `web.yml`: `apps/web/**` değişince; pnpm kur, `pnpm install --frozen-lockfile`, `lint`, `tsc --noEmit`, `test`, `build` (build için `NEXT_PUBLIC_*` sahte değerlerle). `ai.yml`: `services/ai/**` değişince; `astral-sh/setup-uv`, `uv run ruff check .`, `uv run pytest -q`.
- [ ] **Step 3:** Push et, iki workflow yeşil. Render ve Vercel'de ortam değişkenlerini panele gir; `ALLOWED_ORIGIN` = Vercel alan adı, Vercel'de `NEXT_PUBLIC_AI_API_URL` = Render adresi.
- [ ] **Step 4:** Canlıda Task 9 Step 5 senaryo 1 ve 2'yi tekrarla. Supabase Auth > URL Configuration'a Vercel alan adını ekle.
- [ ] **Step 5:** Commit: `ci: add GitHub Actions, Dockerfile and Render blueprint`
