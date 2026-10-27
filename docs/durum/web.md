# Hat: Web

Task'lar: 6, 7, 8
Dal: `hat/web`
Sorumlu: tunahan

## Son durum

Web hattı (Task 6, 7, 8) tamam. Task 7 gerçek Supabase ile elle doğrulandı (demo öğrenci ve personel hesapları). Task 8 EXIF kontrolü Task 9 sayfasıyla yapılacak. Sıradaki: `hat/web` için PR, sonra Birleşme hattı (Task 9).

## Sıradaki adım

2. `hat/web` -> `main` PR aç.
3. DB ve AI hatları da `main`e girince Task 9'a geç (`docs/durum/entegrasyon.md`).

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 6: Next.js 16.4 + Tailwind v4 iskeleti, `@theme` token'ları, Glass/Button/StatusPill/Switch/Logo, öğrenci üst menüsü, tüm rotalar için yer tutucu sayfalar. Testler: `pnpm --filter web test` 6/6.
- 2026-10-27 Task 7: Supabase istemcileri (`lib/supabase/{client,server,env}.ts`), `proxy.ts` (oturum yenileme + rol kontrolü), `/giris` (OTP kod + bağlantı), `/auth/callback`, `/hesap` (profil + çıkış), `safeNext` (açık yönlendirme koruması). Testler 20/20.
- 2026-10-27 Port 3100 (3000 başka bir projede kullanılıyordu): `pnpm dev:web` artık `http://localhost:3100`.
- 2026-10-27 `/giris` e-posta + şifre ile giriş (varsayılan) + e-posta koduyla giriş (ikincil). Test: `app/giris/LoginForm.test.tsx`. Testler 30/30.
- 2026-10-27 Task 7 elle doğrulama: öğrenci `/yonetim` isteyince girişten sonra `/`'e döndü; `/hesap` profili Supabase'den gösterdi; çıkış çalıştı; personel `/personel`'e girdi. Düzeltme: `createServerClient` başında `await connection()` (Supabase auth oturum yüklerken `Date.now()` çağırıyor, Cache Components bunu ön-render'da hata sayıyordu).
- 2026-10-27 Task 8: `lib/image.ts` (`fitWithin`, `isSupportedImageType`, `prepareImage`: 1600 px'e küçültme + canvas ile yeniden kodlama, EXIF silinir), `lib/upload.ts` (`uploadReportImage`, bucket `report-media`, yol `{userId}/{uuid}.jpg`). Testler 26/26.

## Engeller

- Task 8 elle doğrulaması (EXIF silindi mi, `exiftool`): Task 9 sayfası ve Supabase gerekli.
- Env yokken tüm sayfalar 500 verir (bilinçli, sessizce kimlik doğrulamasız çalışmasın diye). `apps/web/.env.local` = kök `.env` içindeki `NEXT_PUBLIC_*` satırları.

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Next.js 16 kuruldu (cacheComponents açık). Bu sürüm eğitim verisinden farklı; kod yazmadan önce `apps/web/node_modules/next/dist/docs/` okunmalı (bkz. `apps/web/AGENTS.md`).
- Geist fontu `geist` paketi yerine `next/font/google` ile yükleniyor (Next'in varsayılanı).
- `LayoutProps`/`PageProps` tipleri üretiliyor: tip kontrolü için `pnpm --filter web typecheck` (`next typegen && tsc --noEmit`) kullanın, çıplak `tsc` hata verir.
- `/bildir` için de yer tutucu sayfa eklendi ki menüde 404 olmasın (asıl sayfa Task 9).
- Vitest yapılandırması `vitest.config.mts` (ESM uyarısı nedeniyle).
- Next 16'da `middleware.ts` yerine `proxy.ts` kullanılıyor (aynı işlev, yeni ad).
- Rol kontrolü proxy'de `profiles.role` sorgusuyla yapılıyor (sayfa başına bir ek sorgu). Profil satırı yoksa `student` sayılır.
- `isSupportedImageType` eklendi: yalnızca JPEG/PNG/WebP. HEIC reddedilir (iOS Safari dosya seçicide zaten JPEG'e çevirir).
- Şifreli giriş eklendi: Supabase'in yerleşik e-posta servisi yeni projelerde yalnızca ekip üyelerine posta gönderiyor ve demo adresleri gerçek değil; OTP demo için güvenilir değil. Demo hesapları SQL ile şifreli oluşturuldu (bkz. db.md). Öğrenci kendi kaydı için ileride özel SMTP gerekiyor.
- Geliştirme portu 3100.
- `/giris` hem 6 haneli kod hem e-posta bağlantısını destekliyor.

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)

- DB hattı: Supabase Auth > Email Templates > Magic Link şablonuna `{{ .Token }}` ekleyin ki e-postada 6 haneli kod da gelsin. Auth > URL Configuration'a `http://localhost:3100/auth/callback` ekleyin (yalnızca kodla/bağlantıyla giriş için gerekli).
- Tüm hatlar: pnpm workspace kökte; `apps/web` içinde ayrı `pnpm-workspace.yaml` yok, bağımlılıkları kökten `pnpm --filter web add ...` ile ekleyin.
