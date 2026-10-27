# Hat: Web

Task'lar: 6, 7, 8
Dal: `hat/web`
Sorumlu: tunahan

## Son durum

Task 6 ve 7 tamam (Task 7'nin elle giriş testi Supabase projesi açılınca yapılacak). Task 8 sürüyor.

## Sıradaki adım

Task 8 Step 1: lib/image.test.ts (fitWithin)

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 6: Next.js 16.4 + Tailwind v4 iskeleti, `@theme` token'ları, Glass/Button/StatusPill/Switch/Logo, öğrenci üst menüsü, tüm rotalar için yer tutucu sayfalar. Testler: `pnpm --filter web test` 6/6.
- 2026-10-27 Task 7: Supabase istemcileri (`lib/supabase/{client,server,env}.ts`), `proxy.ts` (oturum yenileme + rol kontrolü), `/giris` (OTP kod + bağlantı), `/auth/callback`, `/hesap` (profil + çıkış), `safeNext` (açık yönlendirme koruması). Testler 20/20.

## Engeller

- Task 7 elle doğrulaması: Supabase projesi ve `apps/web/.env.local` gerekli. Env yokken tüm sayfalar 500 verir (bilinçli, sessizce kimlik doğrulamasız çalışmasın diye).

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Next.js 16 kuruldu (cacheComponents açık). Bu sürüm eğitim verisinden farklı; kod yazmadan önce `apps/web/node_modules/next/dist/docs/` okunmalı (bkz. `apps/web/AGENTS.md`).
- Geist fontu `geist` paketi yerine `next/font/google` ile yükleniyor (Next'in varsayılanı).
- `LayoutProps`/`PageProps` tipleri üretiliyor: tip kontrolü için `pnpm --filter web typecheck` (`next typegen && tsc --noEmit`) kullanın, çıplak `tsc` hata verir.
- `/bildir` için de yer tutucu sayfa eklendi ki menüde 404 olmasın (asıl sayfa Task 9).
- Vitest yapılandırması `vitest.config.mts` (ESM uyarısı nedeniyle).
- Next 16'da `middleware.ts` yerine `proxy.ts` kullanılıyor (aynı işlev, yeni ad).
- Rol kontrolü proxy'de `profiles.role` sorgusuyla yapılıyor (sayfa başına bir ek sorgu). Profil satırı yoksa `student` sayılır.
- `/giris` hem 6 haneli kod hem e-posta bağlantısını destekliyor.

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)

- DB hattı: Supabase Auth > Email Templates > Magic Link şablonuna `{{ .Token }}` ekleyin ki e-postada 6 haneli kod da gelsin. Auth > URL Configuration'a `http://localhost:3000/auth/callback` ekleyin.
- Tüm hatlar: pnpm workspace kökte; `apps/web` içinde ayrı `pnpm-workspace.yaml` yok, bağımlılıkları kökten `pnpm --filter web add ...` ile ekleyin.
