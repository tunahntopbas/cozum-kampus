# Önce tüm web arayüzü

Kullanıcı kararı: tüm frontend mevcut tasarımlara göre tamamlanacak, sonra backend/P1 ve dağıtımın kalan işleri ele alınacak. Backend'i eksik ekranlarda açıkça işaretlenmiş etkileşimli demo verisi kullanılacak (kullanıcı onayladı). Mevcut gerçek giriş, profil kaydı ve `/bildir` akışı korunacak.

Kaynak: `docs/PROJE_REHBERI.md` §5–6 ve `docs/tasarim/*.dc.html`; `eski-mobil/` kullanılmaz. Renkler, Geist, Phosphor, cam paneller, yerleşimler korunur. Yeni tasarım yönü yok. Web dar ekranlarda kullanılabilir olmalı; native mobil kapsam dışı.

13 ekran: öğrenci `/`, `/bildirimlerim`, `/oneriler`, `/bildir`, `/bildirimler`, `/hesap`; personel `/personel`, `/personel/gecmis`, `/personel/malzeme`; yönetim `/yonetim`, `/yonetim/bildirimler`, `/yonetim/birimler`, `/yonetim/kampus-sesi`.

Demo davranışları: arama/filtre/sekme/seçim, detay paneli, oy verme, öneri oluşturma/yanıtlama, yerel iş durumları, malzeme talepleri ve bildirim tercihleri gerçekten UI durumunu değiştirmeli. Demo işlemleri gerçek veritabanına yazılmaz; ekranlarda "Demo verileri" işareti bulunur. Kullanıcıya sunucuya kaydedildiği söylenmez. Reload sonrası sıfırlanabilir. Gerçek hesap/bildirim bileşenleri demo verisine çevrilmez.

Personel üç sekme, yönetim dört sekme; rollerin mevcut proxy koruması korunur. Harita tasarımdaki şematik kampüs olabilir; gerçek GIS/Realtime bu teslimin koşulu değil. Silme gibi desteklenmeyen gerçek işlemler başarı taklidi yapmaz. Güvenlik rolüne yeni ekran tasarlanmaz.

Kabul: tüm rotalar açılır, yakında yer tutucuları kaldırılır, tasarımdaki ana paneller vardır, etkileşimler çalışır, dar ekranda yatay taşma yok, klavye etiketleri vardır, test/lint/typecheck/build geçer, tarayıcıda üç rol doğrulanır. UI tamam ile backend tamam ayrı raporlanır.
