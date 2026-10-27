# Hat: Tüm frontend

Dal: `codex/frontend-complete`
Sorumlu: Codex (öğrenci/personel/yönetim ekranları paralel çalışan agent'lara ayrıldı).

## Son durum

Kullanıcı önceliği değiştirdi: tüm web UI önce, backend kalanları sonra. Eksik backend ekranlarında açıkça işaretlenmiş etkileşimli demo verisi kullanımı onaylandı. Çalışan gerçek giriş, `/bildir` ve `/hesap` korunuyor.

Aktif plan: `docs/superpowers/plans/2026-10-27-frontend-tamamlama.md`.
Tasarım: `docs/superpowers/specs/2026-10-27-frontend-design.md` ve `docs/tasarim/*.dc.html`.

## Sıradaki adım

Üç alanı birleştir, davranış testleri + lint + typecheck + build çalıştır. Sonra üç rolü tarayıcıda ve dar ekranda kontrol et. Durum dosyasını güncelle, commit + push + PR.

## Yapılanlar

- 2026-10-27 Kapsam ve plan dosyaları yazıldı. Öğrenci 4 eksik ekran, personel 3 ekran, yönetim 4 ekran ayrı dosya kapsamlarında uygulanıyor.
- Ortak hata, yükleniyor ve bulunamadı ekranları mevcut tasarım token'larıyla eklendi.

## Açık işler

- Demo işlemleri henüz backend'e bağlı değil; bu bilinçli kullanıcı kararı.
- Native mobil uygulama bu teslimin dışında.
- Canlı `/bildir` ve `/hesap` mevcut gerçek entegrasyonlar olarak kalır.
