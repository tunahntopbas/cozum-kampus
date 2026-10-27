export const units = [
  { name: "Yapı İşleri", open: 11, days: "3,1", sla: 78, category: "Aydınlatma", staff: 4 },
  { name: "Bilgi İşlem", open: 6, days: "1,2", sla: 94, category: "Ağ ve internet", staff: 3 },
  { name: "Temizlik", open: 5, days: "0,9", sla: 97, category: "Zemin ve hijyen", staff: 3 },
  { name: "Teknik Servis", open: 4, days: "1,8", sla: 88, category: "Isıtma ve su", staff: 2 },
  { name: "Güvenlik", open: 2, days: "0,4", sla: 100, category: "Giriş ve devriye", staff: 2 },
];
export type DemoReport = { id: number; title: string; place: string; urgency: string; unit: string; status: string; age: string; category: string; person: string; note: string };
export const reports: DemoReport[] = [
  { id: 2041, title: "Koridor lambası yanmıyor", place: "Mühendislik Fakültesi, 2. kat", urgency: "Orta", unit: "Yapı İşleri", status: "İşlemde", age: "10 sa", category: "Aydınlatma", person: "Demo Personel 01", note: "" },
  { id: 2044, title: "Asansör kapısı kapanmıyor", place: "Bilgisayar ve Bilişim Bilimleri Fak.", urgency: "Acil", unit: "Yapı İşleri", status: "Atandı", age: "1 gün", category: "Asansör", person: "Demo Personel 02", note: "" },
  { id: 2046, title: "Su sızıntısı", place: "Yemekhane girişi", urgency: "Acil", unit: "Yapı İşleri", status: "Atandı", age: "3 sa", category: "Su", person: "", note: "" },
  { id: 2049, title: "Yurt B blokta sıcak su yok", place: "Yurt, B blok", urgency: "Orta", unit: "", status: "Yönlendirilmedi", age: "40 dk", category: "Su", person: "", note: "" },
  { id: 2050, title: "Açık otopark aydınlatması", place: "Açık otopark", urgency: "Orta", unit: "Yapı İşleri", status: "Gecikmiş", age: "4 gün", category: "Aydınlatma", person: "", note: "" },
  { id: 2048, title: "Derslikte kırık sıra", place: "Eğitim Fakültesi, B 105", urgency: "Düşük", unit: "Yapı İşleri", status: "Alındı", age: "2 gün", category: "Donanım", person: "", note: "" },
  { id: 2051, title: "Kafeterya masaları kirli", place: "Kafeterya", urgency: "Düşük", unit: "Temizlik", status: "İşlemde", age: "5 sa", category: "Temizlik", person: "", note: "" },
  { id: 2039, title: "Kütüphane 2. katta internet kesik", place: "Kütüphane, 2. kat", urgency: "Orta", unit: "Bilgi İşlem", status: "Çözüldü", age: "1 gün", category: "İnternet", person: "", note: "" },
  { id: 2043, title: "Yemekhane girişinde su birikintisi", place: "Yemekhane, giriş", urgency: "Orta", unit: "Yapı İşleri", status: "Yeniden açıldı", age: "2 gün", category: "Su", person: "", note: "" },
];
export const peopleForUnit = (name: string) => {
  const index = units.findIndex((unit) => unit.name === name);
  return Array.from({ length: units[index]?.staff ?? 0 }, (_, n) => `Demo Personel ${String(index * 4 + n + 1).padStart(2, "0")}`);
};
export type Suggestion = { id: number; title: string; category: string; votes: number; status: string; date: string; createdAt: string; reply: string; notify: boolean };
export const suggestions: Suggestion[] = [
  { id: 1, title: "Yemekhanede her gün vejetaryen seçenek olsun", category: "Yemekhane", votes: 286, status: "Yanıt bekliyor", date: "18 Eki", createdAt: "2026-10-18T09:00:00+03:00", reply: "", notify: true },
  { id: 2, title: "Ring seferleri akşam saatlerinde sıklaşsın", category: "Ulaşım", votes: 241, status: "Değerlendiriliyor", date: "9 Eki", createdAt: "2026-10-09T09:00:00+03:00", reply: "Demo yanıt: Sefer sıklığı değerlendiriliyor.", notify: true },
  { id: 3, title: "Mühendislik Fakültesi önüne kapalı bisiklet park alanı", category: "Ulaşım", votes: 138, status: "Uygulandı", date: "2 Eki", createdAt: "2026-10-02T09:00:00+03:00", reply: "", notify: false },
  { id: 4, title: "Ders çalışma alanlarına daha fazla priz eklensin", category: "Akademik", votes: 97, status: "Yanıt bekliyor", date: "26 Eki", createdAt: "2026-10-26T09:00:00+03:00", reply: "", notify: true },
  { id: 5, title: "Yurt çamaşırhanesi 24 saat açık olsun", category: "Yaşam", votes: 64, status: "Yanıt bekliyor", date: "21 Eki", createdAt: "2026-10-21T09:00:00+03:00", reply: "", notify: true },
  { id: 6, title: "Kütüphane final haftasında sabaha kadar açık kalsın", category: "Kütüphane", votes: 412, status: "Planlandı", date: "12 Eki", createdAt: "2026-10-12T09:00:00+03:00", reply: "Demo yanıt: Final haftası için çalışma planlandı.", notify: true },
];
