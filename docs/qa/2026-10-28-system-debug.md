# Sistem debug kontrol listesi — 2026-10-28

Dal: `codex/system-debug-audit`. Durum: araştırma ve test sürüyor. Her satırın başlangıç durumu **DENENMEDİ**; otomatik testin geçmesi tarayıcı/DB doğrulaması yerine sayılmaz.

Üretimde yalnızca test için oluşturulan kayıtlar değiştirilecek; mevcut kullanıcı içeriği silinmeyecek. Anahtarlar, ham fotoğraflar ve kişisel içerik loglanmayacak.

| Route | Ekran | Kontrol grubu | Durum |
|---|---|---|---|
| `/` | Harita | arama, bina/durum/kategori filtresi, pin, detay, destek | DENENMEDİ |
| `/bildir` | Bildir | fotoğraf/yazı/ses, konum, anonim, analiz, uygunsuz içerik, gönder | DENENMEDİ |
| `/bildirimlerim` | Bildirimlerim | sekme, filtre, detay, geri çek, ek fotoğraf, tercih | DENENMEDİ |
| `/oneriler` | Öneriler | ekle, oy, benzer öneri, yönetim yanıtı | DENENMEDİ |
| `/bildirimler` | Bildirimler | filtre, okundu, tercih | DENENMEDİ |
| `/hesap` | Hesap | profil kaydet, çıkış, pasif hesap silme | DENENMEDİ |
| `/personel` | Personel işler | iş seç, yola çık, başla, çözüm fotoğrafı, tamamla, devret, rota | DENENMEDİ |
| `/personel/gecmis` | Personel geçmiş | ara, filtre, seç, önce/sonra | DENENMEDİ |
| `/personel/malzeme` | Malzeme | ara, eksikleri iste, talep | DENENMEDİ |
| `/yonetim` | Yönetim genel | dönem, kategori, harita, incele, özet | DENENMEDİ |
| `/yonetim/bildirimler` | Yönetim bildirim | filtre, seç, birim/aciliyet/durum/teknisyen, not, kaydet | DENENMEDİ |
| `/yonetim/birimler` | Birimler | birim seç, personel atama, malzeme hazırla/reddet | DENENMEDİ |
| `/yonetim/kampus-sesi` | Kampüs sesi | filtre/sırala, AI taslağı, durum, yanıt yayımla | DENENMEDİ |

## Öncelikli bildirilen hatalar

- Yönetim yanıtı: test önerisi #8 için DB kaydı, `planlandi` durumu, 1 alıcı bildirimi, öğrenci ekranı ve `/oneriler#oneri-8` bağlantısı doğrulandı. Açık ekranın yenilenmemesi için görünürken 30 sn/focus refresh düzeltmesi hazırlanıyor.
- Portre + küfür içeren bildirimin yayımlanması: araştırılıyor. Model cevabı, istemci analizi, gönderim ve DB yayım sınırı ayrı kontrol edilecek.

## Tekrarlanabilir doğrulama

Her işlemde UI mesajı + ağ yanıtı + kalıcı DB kaydı + alıcı rolde görünme + yenileme sonrası görünme kaydedilecek. Testler temiz/uygunsuz içerik, servis kesintisi, gecikme, çift tıklama ve yetkisiz rolü kapsayacak.

## Gerçek tarayıcı ve DB kanıtları

- Yönetim: #8 yanıtı yayınlandı, başarı mesajı 1 alıcı; SQL yanıt ve bildirim kaydı doğrulandı. Öğrenci hesabında aynı yanıt göründü.
- Öğrenci öneriler: Yeni/Yanıtlananlar, Yaşam filtresi; #8 oy aç/kapa; SQL vote_count=0 ile eski duruma dönüldü.
- Bildirimler: yalnızca #8 QA bildirimi okundu işaretlendi, sayaç 6→5. Okunmamış ve Yanıtlar filtresi doğru sonuç verdi; Yanıtı oku doğru #8 önerisini açtı. Toplu okundu ve tercihler henüz gerçek UI'da denenmedi.
- Harita: gerçek MapLibre/pinler yüklendi. Bina aç/kapa sonrası aria-expanded=false ve satırlar gizli. Acil filtresi 4 kayıt, geçmişi aç/kapat, acil kartı ve tel:112 bağlantısı doğru. Telefon aranmadı. Zoom +/- tıklandı (kamera konumunun sayısal doğrulaması yapılmadı). Eşleşmeyen arama 0 sonuç ve boş durum gösterdi.
- Bildirimlerim: Desteklediklerim sekmesi, Çözüldü filtresi ve #9 doğru detay/timeline gösterdi. Mevcut kayıtlar geri çekilmedi veya fotoğraf değiştirilmedi.
- Hesap: mevcut profil değerleriyle kaydet → Kaydedildi. Başarılı çıkış başladı; yönlendirme doğrulaması sürüyor. Hata/network senaryoları regresyon testinde.
- Moderasyon: kullanıcı şikayetiyle eşleşen #20, AI güveni null iken public görünüyordu. Geri alınabilir şekilde gizlendi; SQL public_count=0. Fotoğraf LLM'e yeniden gönderilmedi; kayıt silinmedi.

## Henüz doğrulanmamış sınırlar

Canlı API yeni kodu kullanmıyor; yeni publication/staff migration uygulanmadı. Sentetik portre ve temiz fotoğrafın gerçek model uçtan uca testi, servis kesintisi sırasında gönderim, bütün personel/yönetim eylemleri ve mobil viewport kontrolleri tamamlanmadı. Liste tüm-sistem başarı iddiası değildir.
