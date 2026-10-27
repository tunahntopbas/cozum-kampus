# Hat: Web

Task'lar: 6, 7, 8
Dal: `hat/web`
Sorumlu: tunahan

## Son durum

Task 6 tamam (Next.js iskeleti, token'lar, ortak bileşenler, yer tutucu sayfalar). Task 7 başlıyor.

## Sıradaki adım

Task 7 Step 1: lib/auth.ts için başarısız testleri yaz (isAllowedEmail, requiredRole)

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 6: Next.js 16.4 + Tailwind v4 iskeleti, `@theme` token'ları, Glass/Button/StatusPill/Switch/Logo, öğrenci üst menüsü, tüm rotalar için yer tutucu sayfalar. Testler: `pnpm --filter web test` 6/6.

## Engeller

Yok.

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Next.js 16 kuruldu (cacheComponents açık). Bu sürüm eğitim verisinden farklı; kod yazmadan önce `apps/web/node_modules/next/dist/docs/` okunmalı (bkz. `apps/web/AGENTS.md`).
- Geist fontu `geist` paketi yerine `next/font/google` ile yükleniyor (Next'in varsayılanı).
- `LayoutProps`/`PageProps` tipleri üretiliyor: tip kontrolü için `pnpm --filter web typecheck` (`next typegen && tsc --noEmit`) kullanın, çıplak `tsc` hata verir.
- `/bildir` için de yer tutucu sayfa eklendi ki menüde 404 olmasın (asıl sayfa Task 9).
- Vitest yapılandırması `vitest.config.mts` (ESM uyarısı nedeniyle).

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)

- Tüm hatlar: pnpm workspace kökte; `apps/web` içinde ayrı `pnpm-workspace.yaml` yok, bağımlılıkları kökten `pnpm --filter web add ...` ile ekleyin.
