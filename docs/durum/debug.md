# Sistem debug hattı

Dallar: `codex/system-debug-audit` (Codex, birleşmedi), `hat/moderasyon` (hafif düzeltme)
Tarih: 2026-10-28

## Son durum

Codex'in denetiminde bulunan "uygunsuz fotoğraflı bildirim yayımlandı" hatası hafif yoldan kapatıldı. Kullanıcı kararı: yayın mimarisi (sunucuya taşıma) değiştirilmedi. Codex'in bağımsız küçük düzeltmeleri `hat/moderasyon` dalına alındı.

- Yapay zeka denetimi geçmeyen ya da tamamlanamayan bildirim `is_hidden=true` kaydedilir, haritada görünmez. Öğrenci gönderebilir (servis uyusa da), yönetim `/yonetim/bildirimler` "Yayında değil" filtresinden bulup "Yayınla" ya da "Gizle" der.
- Denetim reddederse gönderim engellenir (değişmedi).
- AI istemi sertleştirildi (portre/selfie, ilgisiz görsel, emin değilse ret, istem enjeksiyonu); `Moderation` gerekçe varken onayı kabul etmez; yedek analiz onay vermez.
- Codex'ten alınanlar: yanıt doğrulaması (`lib/ai.ts`), yönetim RPC `false` sonucunun hata sayılması, harita bina aç/kapa ve yeni veri, bildirim ve öneri ekranlarının görünürken yenilenmesi, çıkış hatası, malzeme ekranı düzeltmeleri.

## Alınmayanlar (Codex dalında duruyor)

- Sunucu yayını: `services/ai` `/reports/submit` ve `/reports/{id}/media`, migration `000012` ve `000014`. Tarayıcıyı atlatıp doğrudan REST ile yazan biri hâlâ görünür bildirim açabilir.
- Personel atomik durum RPC'si (`000013`) ve buna bağlı `StaffJobsView` değişikliği (testleri kırıktı).

## Sıradaki adım

1. `hat/moderasyon` PR'ı birleşir; Render AI'ı ve Vercel web'i otomatik yayınlar.
2. Demo verisini temizle: Codex test kayıtları (#20 gibi), QA bildirimleri, test oyları.
3. En son: anahtarlar, demo şifresi, Render'ı uyandır.
