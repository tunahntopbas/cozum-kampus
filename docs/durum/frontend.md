# Hat: Tüm frontend

Dal: `codex/frontend-complete`
Sorumlu: Codex

## Son durum

13 web ekranının tamamı uygulandı. 11 eksik ekran etkileşimli demo veriyle tamamlandı; mevcut gerçek `/bildir` ve `/hesap` entegrasyonları korundu. Backend bağlantısı olmayan işlemler açıkça demo olarak işaretlenir. Demo state ekran/sekme değişiminde sıfırlanır; sunucuya yazılmaz.

Plan: `docs/superpowers/plans/2026-10-27-frontend-tamamlama.md`.
Tasarım: `docs/superpowers/specs/2026-10-27-frontend-design.md` ve `docs/tasarim/*.dc.html`.

## Sıradaki adım

1. Frontend PR'ını incele ve birleştir; kullanıcı onayı olmadan main'e merge etme.
2. Vercel üretim yayınından sonra aynı rol ve dar ekran kontrollerini tekrarla.
3. Kullanıcı görsel incelemesinden sonra demo adapter'larını gerçek Supabase/AI bağlantılarına sırayla geçir. Gerçek GIS, Realtime ve backend eksikleri bu teslimde tamamlanmadı.
4. Entegrasyon planında bekleyen Supabase Auth URL ayarı, fotoğraflı canlı test ve giriş sonrası next yönlendirme incelemesini ele al.

## Yapılanlar

- 2026-10-27 Öğrenci: şematik kampüs haritası, kategori/durum/bina filtreleri, kayıt seçimi, zaman çizelgesi, destek; Bildirimlerim sekme/filtre/ek görsel/geri çekme/haber ver; öneri oluşturma ve oylar; bildirim merkezi, çözüm onayı ve tercih anahtarları.
- Personel: üç sekmeli ortak iskelet; rota listesi, iş adımları, yerel çözüm görseli, devretme, geçmiş ve stok/talep ekranları.
- Yönetim: dört sekmeli ortak iskelet; KPI/ısı haritası/örnek haftalık özet; bildirim filtreleri, yönlendirme/iç not; birimler ve atama; kampüs sesi durum/yanıt ve açıkça örnek olarak işaretli AI taslağı.
- Ortak hata/yükleniyor/bulunamadı ekranları.
- Next.js CSS modüllerini bozan genel `*.css` Turbopack kuralı `globals.css` ile sınırlandı. Tarayıcıda modül sınıfları artık doğru; gerçek mevcut sayfalar da kontrol edildi.
- Kod incelemesi: yönetim önerilerinde En yeni sıralaması ISO tarihe geçirildi ve regresyon testi eklendi. Ekran state'inin sekme değişiminde sıfırlandığını demo açıklamaları doğru bildiriyor.

## Doğrulama

- `pnpm --filter web test`: 86/86; 17 test dosyası.
- `pnpm --filter web lint`: temiz.
- `pnpm --filter web typecheck`: temiz.
- `pnpm --filter web build`: üretim derlemesi başarılı; tüm rotalar listelendi.
- Tarayıcı: yönetim hesabıyla öğrenci/personel/yönetim 13 rota açıldı. 1440px ve 390px öğrenci rotaları, 390px tüm personel/yönetim ekranları; yatay taşma yok. Masaüstü harita/personel/yönetim ekran görüntüleri `.playwright-mcp/` içinde (git dışı).

## Sınırlar

- Demo verileri ekranlar arasında ortak/persistent değil; bu açıkça belirtilir.
- AI rapor taslakları statik örnek; gerçek AI çağrısı yapıldığı söylenmez.
- Harita şematik, gerçek coğrafi harita/Realtime sonraki iş.
- Hesap silme gerçek backend desteği beklediğinden pasif; başarı taklidi yok.
- Native mobil uygulama kapsam dışında; web responsive.
- Kullanıcının `… 2` isimli izlenmeyen dosyalarına dokunulmadı ve PR'a alınmadı.
