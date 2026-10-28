# Hat: Web

Task'lar: 6, 7, 8
Dal: `hat/web`
Sorumlu: tunahan

## Son durum

Uygulama canlıda (https://cozum-kampus.vercel.app), üç panel uçtan uca doğrulandı. Vercel fonksiyonları Seul'de (`icn1`), Supabase ile aynı bölgede. Hesap silme açıldı; proxy ve sayfalar oturumu JWT'den yerelde doğruluyor.

## Sıradaki adım

1. Sunumdan sonra anahtarları yenile: Gemini `LLM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_PASSWORD`, demo hesabın şifresi (Vercel, Render, `.env`, `apps/web/.env.local`).

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 6: Next.js 16.4 + Tailwind v4 iskeleti, `@theme` token'ları, Glass/Button/StatusPill/Switch/Logo, öğrenci üst menüsü, tüm rotalar için yer tutucu sayfalar. Testler: `pnpm --filter web test` 6/6.
- 2026-10-27 Task 7: Supabase istemcileri (`lib/supabase/{client,server,env}.ts`), `proxy.ts` (oturum yenileme + rol kontrolü), `/giris` (OTP kod + bağlantı), `/auth/callback`, `/hesap` (profil + çıkış), `safeNext` (açık yönlendirme koruması). Testler 20/20.
- 2026-10-27 Port 3100 (3000 başka bir projede kullanılıyordu): `pnpm dev:web` artık `http://localhost:3100`.
- 2026-10-27 `/giris` e-posta + şifre ile giriş (varsayılan) + e-posta koduyla giriş (ikincil). Test: `app/giris/LoginForm.test.tsx`. Testler 30/30.
- 2026-10-27 Task 7 elle doğrulama: öğrenci `/yonetim` isteyince girişten sonra `/`'e döndü; `/hesap` profili Supabase'den gösterdi; çıkış çalıştı; personel `/personel`'e girdi. Düzeltme: `createServerClient` başında `await connection()` (Supabase auth oturum yüklerken `Date.now()` çağırıyor, Cache Components bunu ön-render'da hata sayıyordu).
- 2026-10-27 Task 8: `lib/image.ts` (`fitWithin`, `isSupportedImageType`, `prepareImage`: 1600 px'e küçültme + canvas ile yeniden kodlama, EXIF silinir), `lib/upload.ts` (`uploadReportImage`, bucket `report-media`, yol `{userId}/{uuid}.jpg`). Testler 26/26.
- 2026-10-28 PR #21: küfür filtresi (`lib/profanity.ts` + DB trigger `0015`); gönder butonu analiz bitene kadar bekliyor.
- 2026-10-28 PR #23: yalnızca `@sakarya.edu.tr` ile giriş (`0016`), admin için `PanelSwitch` (öğrenci/personel/yönetim).
- 2026-10-28 PR #24: `vercel.json` `regions: ["icn1"]`; doğrulandı, prod deploy `icn1`'de.
- 2026-10-28 PR #25: öneri formunda kategori tahmini (`guessCategory`), mobil düzen düzeltmeleri, `/kvkk` sayfası.
- 2026-10-28 PR #26/#27: panel geçişi tam sayfa yüklemeyle; durum bildirimleri kişinin kendi işlemlerinde de geliyor (`0017`). AI tarafında kota dolunca yedek modele geçiş.
- 2026-10-28 Vercel `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=sakarya.edu.tr` (tüm ortamlar) ve prod yeniden deploy.
- 2026-10-28 Hesap silme: `public.delete_my_account()` (`0018`, yalnız öğrenci; bildirim ve öneriler anonim kalır, oy/bildirim/tercihler silinir), `/hesap` iki adımlı onay butonu (`DeleteAccountButton`). Personel/yönetici hesapları yönetimce kapatılır.
- 2026-10-28 Hız: proxy ve sayfalar `getUser()` yerine `getClaims()` (ES256 JWT yerelde doğrulanır, auth sunucusuna gidiş yok). Rol `0019` ile `app_metadata.role`'e kopyalanıyor; proxy rolü token'dan okuyor, yoksa `profiles`'a soruyor. Prod ölçüm (oturumlu, Türkiye'den): ilk bayt ~650 ms -> ~480 ms, sayfa ~1.35 sn -> ~1.05 sn (sıcak ~0.7 sn). Kalan süre Türkiye-Seul mesafesi (~300 ms gidiş-dönüş).
- 2026-10-28 EXIF canlı doğrulama: GPS ve kamera etiketli JPEG `/bildir`'e yüklendi; Storage'a giden dosyada 0 EXIF etiketi, GPS yok. Test dosyası silindi, AI isteği kesildi (kota harcanmadı).
- 2026-10-28 KVKK saklama: `private.apply_retention()` (`0020`) her gece 03:30 pg_cron ile; bir yılı geçen bildirim ve öneriler sahibinden ayrılır, uygulama bildirimleri bir yılda, `ai_runs` 90 günde silinir. `/kvkk` "Saklama süresi" metni buna göre güncellendi.

## Engeller

- Env yokken tüm sayfalar 500 verir (bilinçli, sessizce kimlik doğrulamasız çalışmasın diye). `apps/web/.env.local` = kök `.env` içindeki `NEXT_PUBLIC_*` satırları.

## Alınan kararlar

- Hesap silme yalnız öğrenciler için: personel/yönetici hesapları atama ve not geçmişine bağlı (NOT NULL), bu yüzden yönetim kapatır.
- Rol JWT'de yalnız yönlendirme için kullanılır; yetkinin kaynağı `profiles.role` ve RLS. Rol değişince token yenilenene kadar (≤1 saat) eski panel görünebilir, veriye erişim RLS'den dolayı değişmez.

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
