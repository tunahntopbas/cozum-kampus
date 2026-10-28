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

Tamamlandı, `main`de. Bu hatta açık iş yok; genel açık işler [README.md](README.md)'de.

## Uçtan uca test (2026-10-28)

Demo verisi silindi, akış baştan elle (Playwright) denendi.

- Öğrenci: bildirim (foto + metin + bina) AI analiziyle yönlendirildi ve haritada çıktı; küfürlü metin hem bildirimde hem öneride engellendi (istemci + DB trigger, PR #21); öneri yayınlandı; geri çekme, sessize alma, hesap kaydetme çalışıyor.
- Yönetim: "Yayında değil" filtresi, yayınla, birim/aciliyet/teknisyen/durum/iç not kaydı; Birimler ekranı; malzeme talebi "Hazırla" (stok yetersizse "Hazır" kilitli); Kampüs sesi AI taslağı ve yanıt yayınlama.
- Personel: işe başla, çözüm fotoğrafı (AI doğrulamadı, "Yine de tamamla"), geçmiş, malzeme talebi, devret penceresi, rota linki.
- Öğrenci tarafında 5 bildirim geldi (atandı, işlemde, çözüldü, öneri yanıtı); yanıt öneri sayfasında görünüyor.

Bulunan ve düzeltilen: analiz sürerken gönder basılınca bildirim gizli ve "Diğer" kategorisiyle düşüyordu; buton artık analiz bitene kadar "Analiz bekleniyor" (PR #21).

Engeller:
- Gemini ücretsiz kota: model başına günde 20 istek. `gemini-3.5-flash` doldu; yerel `.env` ve Render `LLM_MODEL` şimdilik `gemini-flash-lite-latest`. Demo için faturalandırma açılmalı ya da ücretli anahtar alınmalı; aksi halde analiz düşer ve bildirimler gizli kalır.
- Lite model fotoğrafta yüz görünce içeriği reddediyor (kural gereği). Demo fotoğraflarında kişi olmasın.
- Dev modunda `router.refresh()` 2-4 sn gecikiyor; prod'da sorun değil.
