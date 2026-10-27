import type { ReportStatus } from "@/lib/status";

export type DemoReport = {
  id: number; title: string; building: string; place: string; category: string;
  status: ReportStatus; urgent?: boolean; accessible?: boolean; mine: boolean;
  supported?: boolean; people: number; time: string; unit: string;
};
export const reports: DemoReport[] = [
  { id: 2041, title: "Koridor lambası yanmıyor", building: "Mühendislik Fakültesi", place: "2. kat", category: "Aydınlatma", status: "islemde", mine: true, people: 5, time: "10:40", unit: "Yapı İşleri" },
  { id: 2038, title: "Asansör kapısı kapanmıyor", building: "Bilgisayar ve Bilişim Bilimleri Fak.", place: "Zemin kat", category: "Erişilebilirlik", status: "islemde", urgent: true, accessible: true, mine: true, people: 11, time: "Dün", unit: "Yapı İşleri" },
  { id: 2035, title: "Kütüphane 2. katta internet kesik", building: "Kütüphane", place: "2. kat", category: "İnternet", status: "alindi", mine: true, people: 8, time: "26 Eki", unit: "Bilgi İşlem" },
  { id: 2029, title: "Derslikte kırık sıra", building: "Eğitim Fakültesi", place: "B 105", category: "Donanım", status: "alindi", mine: true, people: 2, time: "25 Eki", unit: "Yapı İşleri" },
  { id: 2021, title: "Yemekhane girişinde su birikintisi", building: "Yemekhane", place: "Giriş", category: "Temizlik", status: "cozuldu", mine: true, people: 4, time: "24 Eki", unit: "Temizlik" },
  { id: 2004, title: "Yurt koridorunda lamba arızası", building: "Yurt", place: "3. kat", category: "Aydınlatma", status: "cozuldu", mine: true, people: 3, time: "19 Eki", unit: "Yapı İşleri" },
  { id: 2040, title: "Projeksiyon cihazı açılmıyor", building: "Mühendislik Fakültesi", place: "Lab 204", category: "Donanım", status: "alindi", mine: false, supported: true, people: 2, time: "09:45", unit: "Bilgi İşlem" },
  { id: 2039, title: "Yurt rampasında kaygan zemin", building: "Yurt", place: "Giriş rampası", category: "Temizlik", status: "islemde", urgent: true, accessible: true, mine: false, supported: true, people: 6, time: "09:20", unit: "Temizlik" },
];
export type Suggestion = { id: number; title: string; body: string; category: string; votes: number; status: string; date: string; createdAt: string; author?: string; reply?: string; unit?: string };
export const suggestions: Suggestion[] = [
  { id: 1, title: "Kütüphane final haftasında sabaha kadar açık kalsın", body: "Final haftasında 22:00 kapanışı yetmiyor. Çalışma salonları gece boyunca açık olursa yurttaki arkadaşlar da yararlanır.", category: "Kütüphane", votes: 412, status: "Planlandı", date: "12 Eki", createdAt: "2026-10-12T12:00:00+03:00", unit: "Kütüphane Daire Başkanlığı", reply: "Final haftasında iki salon pilot olarak 02:00'ye kadar açık kalacak. Sonuçlara göre tüm salonlara yaygınlaştırılacak." },
  { id: 2, title: "Yemekhanede her gün vejetaryen seçenek olsun", body: "Şu an haftada iki gün vejetaryen menü var. Günlük menüde en az bir vejetaryen ana yemek istiyoruz.", category: "Yemekhane", votes: 286, status: "Değerlendiriliyor", date: "18 Eki", createdAt: "2026-10-18T12:00:00+03:00" },
  { id: 3, title: "Kampüs içi ring seferleri akşam saatlerinde sıklaşsın", body: "17:00 ile 19:00 arasında yurt hattında bekleme süresi çok uzuyor.", category: "Ulaşım", votes: 241, status: "Yanıtlandı", date: "9 Eki", createdAt: "2026-10-09T12:00:00+03:00", unit: "İdari ve Mali İşler", reply: "Sefer sayısı bu dönem için sabit. Yoğunluk verisi toplanıyor, bir sonraki planlamada yurt hattı için ek sefer değerlendirilecek." },
  { id: 4, title: "Mühendislik Fakültesi önüne kapalı bisiklet park alanı", body: "Bisikletler dışarıda kalıyor, yağmurda ve çalınma riskinde sorun yaşanıyor.", category: "Ulaşım", votes: 138, status: "Uygulandı", date: "2 Eki", createdAt: "2026-10-02T12:00:00+03:00", unit: "Yapı İşleri", reply: "24 Ekim'de 20 araçlık alan hizmete açıldı." },
  { id: 5, title: "Ders çalışma alanlarına daha fazla priz eklensin", body: "Fakülte koridorlarındaki masaların çoğunda priz yok, dizüstü bilgisayar şarjı sorun oluyor.", category: "Akademik", votes: 97, status: "Yeni", date: "Dün", createdAt: "2026-10-26T09:00:00+03:00" },
  { id: 6, title: "Yurt çamaşırhanesi 24 saat açık olsun", body: "Ders saatlerinden sonra da çamaşırhaneyi kullanabilmek istiyoruz.", category: "Yaşam", votes: 64, status: "Yeni", date: "Dün", createdAt: "2026-10-26T15:00:00+03:00" },
];
