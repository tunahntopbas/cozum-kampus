# Hat: Öneriler ve bildirim merkezi

Dal: `hat/oneriler-bildirimler`
Sorumlu: tunahan
Kapsam: P1 kalanlar, öğrenci tarafı `/oneriler` ve `/bildirimler`.

## Son durum

İki ekran da gerçek veriyle çalışıyor. Öğrenci arayüzünde demo ekran kalmadı. Yönetimin öneri yanıtı ve personelin/yönetimin durum değişiklikleri öğrenciye bildirim olarak düşüyor.

## Sıradaki adım

Tamamlandı, `main`de. Bu hatta açık iş yok; genel açık işler [README.md](README.md)'de.

## Yapılanlar

- 2026-10-28 Migration `20261028000011_report_notifications.sql`: `report_events`'e `durum` ya da `devredildi` yazılınca bildirimi açan öğrenciye `notifications` kaydı (kendi işlemi, sessize aldığı bildirim ve kapattığı durum bildirimleri hariç). MCP ile uygulandı.
- 2026-10-28 Web: `lib/campus-voice.ts` (`findSimilar` kelime köküne göre benzer öneri, `dayGroup`) + testleri. `components/campus-voice/SuggestionsView` (oy, öneri yazma, benzer öneri, yönetim yanıtı, `public_reports`'tan kampüs karnesi) ve `components/notifications/NotificationsView` (okundu işaretleme, tür filtresi, durum bildirimi tercihi). Demo `Suggestions`, `Notifications`, fixture'lar ve testleri silindi. Testler 143/143.
- 2026-10-28 Demo öğrenciye mevcut bildirim durumlarından 5 bildirim eklendi. Yerelde iki sayfa öğrenci hesabıyla açıldı.

## Bilinen eksikler

- Öneri metni için yapay zeka denetimi yok.
- Çözüm onayı ("Sorun çözüldü mü?"), e-posta ve tarayıcı bildirimi, sessiz saatler elendi.
- Bildirimler Realtime değil; sayfa yenilenince güncellenir.
