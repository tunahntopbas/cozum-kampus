# Hat: DB

Task'lar: 2
Dal: `hat/db`
Sorumlu: tunahan

## Son durum

Task 2 tamam. Supabase projesi `cozumkampus` (ref `owvzlonnpiuigrstsean`, bölge ap-northeast-2 Seoul) üzerinde 3 migration ve seed uygulandı, RLS doğrulandı.

## Sıradaki adım

Tamamlandı, `main`de. Bu hatta açık iş yok; genel açık işler [README.md](README.md)'de.

## Yapılanlar

(tarih, task/adım, kısa not, commit)

- 2026-10-27 Task 2: `supabase/migrations/2026102700000{1,2,3}_*.sql` (şema, RLS, fonksiyon sıkılaştırma), `supabase/seed.sql` (5 birim, 8 bina, 16 QR mekân, 12 kurgusal bildirim + zaman çizelgesi olayları, 3 izinli demo e-postası), `supabase/tests/rls_check.sql`. Hepsi Supabase MCP ile uzak projeye uygulandı.
- 2026-10-27 Task 2 Step 8: demo hesapları SQL ile oluşturuldu (`auth.users` + `auth.identities`, e-posta onaylı, bcrypt şifre): `ogrenci@`, `personel@` (staff, yapi_isleri), `yonetim@` (admin), `guvenlik@` (security, guvenlik) `demo.cozumkampus.app`. Şifre depoda değil: kök `.env` içinde `DEMO_PASSWORD` (ekip içinde güvenli kanaldan paylaşın). Supabase Auth şifreli giriş API'siyle doğrulandı.
- Doğrulama (geri alınan işlemlerle): öğrenci ham `reports` 0, `public_reports` 12, `security_reports` 0, `ai_runs` 0; anon `places` 16, `public_reports` erişimi yok; gmail kaydı reddedildi; okul + izinli e-posta profili oluştu; personel kendi biriminin 9 bildirimini görüyor ve kendi rolünü değiştiremiyor.

## Engeller

- Auth ayarları (e-posta şablonu, Redirect URL, SMTP) MCP ile değiştirilemiyor; panelden yapılmalı. Şifreli giriş kullanıldığı için demo bunlara bağlı değil. Öğrencilerin kendi kaydı ve kodla giriş için: Magic Link şablonuna `{{ .Token }}`, Redirect URL `http://localhost:3100/auth/callback`, özel SMTP (yerleşik servis yalnızca ekip üyelerine posta gönderiyor).

## Alınan kararlar

(Plandan sapmalar ve nedenleri)

- Migration'lar CLI (`supabase db push`) yerine Supabase MCP ile uygulandı; dosyalar yine `supabase/migrations/` altında, kaynak onlar. `SUPABASE_DB_URL` şimdilik gerekmiyor.
- PostGIS `extensions` şemasında; tablolarda tip `extensions.geography`.
- `units` tablosu `profiles`'tan önce oluşturuluyor ki `profiles.unit_id` yabancı anahtar olsun.
- Profil rol/birim değişikliği politikayla değil kolon yetkisiyle engelleniyor: `authenticated` yalnızca `full_name, student_no, department, language` güncelleyebilir.
- RLS yardımcıları (`auth_role`, `auth_unit`, `can_read_report`) `private` şemasında, API'den çağrılamaz.
- Bilinçli bırakılan danışman uyarıları: `public_reports` security definer view (anonim bildirimcinin kimliğini gizler, yalnızca `authenticated` okur); `ai_runs`, `allowed_emails`, `moderation_flags` politikasız (yalnızca servis anahtarı).
- Plan dışı ama gerekli politikalar eklendi: oylar, atamalar, öneriler, yanıtlar, envanter, malzeme talepleri.
- Proje bölgesi Frankfurt değil Seoul (ap-northeast-2). Türkiye'den gecikme daha yüksek; proje boşken yeniden açmak ucuzdu, artık şema var. Demo öncesi gecikme sorun olursa yeni projeye migration'ları tekrar uygulamak ~5 dk.

## Diğer hatlara notlar

(Arayüz değişiklikleri, ihtiyaçlar)

- Web: harita/listeler `public_reports` görünümünü okumalı (`lat`, `lng` kolonları hazır). Ham `reports` yalnızca sahibine, admin'e ve ilgili birim personeline görünür.
- Web: konum yazarken `location` için `SRID=4326;POINT(lng lat)` metni kabul ediliyor.
- AI: `ai_runs` yazımı servis anahtarı ister; `.env`'de `SUPABASE_SERVICE_ROLE_KEY` dolmadan kayıt sessizce düşer (yanıtı bozmaz).
