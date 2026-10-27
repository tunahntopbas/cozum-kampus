# Çözüm Kampüs: yapay zeka asistanları için giriş

Bu dosya Claude dışındaki asistanlar (Codex, Cursor, Gemini vb.) içindir. Çalışma kurallarının tamamı `CLAUDE.md` içinde; önce onu oku ve aynen uygula.

## Sıfır bağlamla başlarken sırayla oku

1. `CLAUDE.md`: çalışma kuralları (dal, TDD, her task sonrası durum dosyası güncelle + commit + push).
2. `docs/durum/README.md`: hatlar ve genel durum.
3. `docs/durum/entegrasyon.md`: son durum ve "Sıradaki adım" (en güncel iş burada).
4. `docs/superpowers/plans/`: aktif plan; işaretsiz (`- [ ]`) adımlar yapılacak işler.
5. `docs/PROJE_REHBERI.md`: ürün kararları. Arayüz için `docs/tasarim/*.dc.html` tasarımlarına birebir uy.

## Bilinmesi gereken teknik noktalar

- Monorepo: `apps/web` (Next.js 16, pnpm), `services/ai` (FastAPI, uv, Python 3.12), `supabase/` (migration ve seed).
- Next.js 16 eğitim verindekinden farklı: `middleware.ts` yerine `proxy.ts`, Cache Components açık. Next kodu yazmadan önce `apps/web/node_modules/next/dist/docs/` oku.
- Komutlar: `pnpm dev:web` (port 3100), `pnpm --filter web test|lint|typecheck`; AI: `cd services/ai && uv run pytest -q`, `uv run ruff check .`, `uv run uvicorn app.main:app --reload --port 8000`.
- Gizli anahtarlar yalnızca `.env` ve `apps/web/.env.local` içinde (git'e girmez, bu bilgisayarda mevcut). Asla commit etme; servis anahtarını ya da LLM anahtarını tarayıcı koduna koyma.
- Port 3000'deki süreç kullanıcının başka bir işi; dokunma.
- `main`e doğrudan commit yok; dalda çalış, PR aç. CI: `.github/workflows/{web,ai}.yml`.
