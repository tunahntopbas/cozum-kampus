# Sistem debug hattı

Dal: `codex/system-debug-audit`
Tarih: 2026-10-28

## Son durum

Tüm panel ve eylemlerin denetimi sürüyor. Kanıt ve kapsam: `docs/qa/2026-10-28-system-debug.md`. Birim testleri gerçek tarayıcı/DB testinin yerine sayılmaz. Canlı site bu dalın değişikliklerini henüz kullanmıyor.

## Yapılanlar

- Yönetim öneri yanıtı #8 gerçek hesaplarla yayımlandı; DB, öğrenci ekranı ve bildirim bağlantısı doğrulandı. Açık öğrenci ekranının başka oturumdaki yanıtı almaması için görünürken yenileme eklendi.
- Yönetim RPC `false` yanıtının başarı sayılması düzeltildi.
- Harita bina aç/kapa ve yeni sunucu verisini yansıtma düzeltildi.
- Personel durum/olay/bildirim atomikliği için RPC migration hazırlandı; henüz uygulanmadı.
- Çözüm fotoğrafı değişince önceki AI kararı temizleniyor. Tarayıcı AI kararı güvenilir kayıt sayılmıyor.
- Çıkış hatasında yönlendirme engellendi; tekrar deneme ve hata mesajı eklendi.
- Yayın sınırı sunucuya taşınıyor; istemci kararıyla doğrudan report/media yazımı engellenecek. API fotoğrafın denetlenen baytlarını sunucuya ait değişmez bir kopyaya alıyor.
- Uygunsuz test bildirimi #20: `is_hidden=false`, `ai_confidence=null`, public görünürlük=1 doğrulandı. Silinmedi; `is_hidden=true` yapıldı ve public görünürlük=0 doğrulandı. Sahibi kendi kayıtlarında görmeye devam edebilir.

## Alınan kararlar

Eski plandaki “AI bekleniyorken doğrudan yayımla” davranışı, kullanıcının uygunsuz içerik hatası talebi nedeniyle kaldırılıyor. Denetim tamamlanamazsa gönderim tekrar denenir; onaysız içerik herkese açılmaz. Bu bilinçli davranış değişikliğidir.

## Sıradaki adım

1. Çalışan ajanların değişikliklerini birleştir ve bağımsız inceleme bulgularını gider.
2. Web/AI test, lint, typecheck, build doğrulamalarını seri çalıştır.
3. SQL migration/RLS/RPC işlemlerini izole/rollback test et. Canlı eski web doğrudan insert kullandığı için migration tek başına uygulanmamalı; API + web + DB sürüm geçişi birlikte planlanmalı.
4. QA matrisindeki denenmemiş eylemleri gerçek tarayıcıda doğrula. Sentetik QA kayıtları dışında mevcut içeriği değiştirme.
5. Durum dosyalarını güncelle, commit/push ve PR. Henüz tüm sistem veya canlı düzeltmeler tamamlandı deneme.
