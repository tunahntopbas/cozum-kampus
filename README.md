# Çözüm Kampüs

Yapay zeka destekli kampüs sorun bildirim ve takip platformu.

- Ürün rehberi: `docs/PROJE_REHBERI.md`
- Aktif plan: `docs/superpowers/plans/`
- Kim ne yapıyor, nerede kaldık: `docs/durum/README.md`

## Yeni oturuma başlarken

```bash
git pull
claude   # CLAUDE.md otomatik okunur; "<hat> hattında devam edelim" de
```

## Kurulum

1. `.env.example` dosyasını `.env` olarak kopyala ve doldur (web için `apps/web/.env.local`).
2. Web: `pnpm install && pnpm dev:web`
3. AI servisi: `cd services/ai && uv run uvicorn app.main:app --reload --port 8000`
4. Veritabanı: `npx supabase link --project-ref <ref> && npx supabase db push`
