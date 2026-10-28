import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "KVKK aydınlatma metni · Çözüm Kampüs" };

const DATA = [
  ["Kimlik ve iletişim", "Ad soyad, okul e-posta adresi, bölüm ve öğrenci numarası (girersen)."],
  ["Bildirim içeriği", "Sorunun fotoğrafı, açıklaması, seçtiğin bina ve kat, paylaşırsan konum."],
  ["Öneriler", "Öneri metni ve verdiğin oylar."],
  ["Kullanım kayıtları", "Bildirimin durum geçmişi, sistem bildirimleri ve tercihlerin."],
];

const SAFEGUARDS = [
  "Fotoğraflar yüklenmeden önce telefonunda yeniden kodlanır; konum ve cihaz bilgisi (EXIF) silinir.",
  "Açıklamadaki e-posta, telefon ve TC kimlik numarası yapay zekaya gitmeden maskelenir. Modele adın, e-postan ya da öğrenci numaran gönderilmez.",
  "Yüzü odakta olan ya da kişisel bilgi içeren fotoğraflar yapay zeka denetiminde reddedilir.",
  "Anonim bildirimlerde adın birimlere ve diğer öğrencilere gösterilmez.",
  "Taciz, şiddet ve güvenlik bildirimleri genel akışa girmez; yalnızca Güvenlik birimi görür.",
  "Fotoğraflar herkese açık değildir; yalnızca yetkili kişilere kısa süreli imzalı bağlantıyla açılır.",
  "Veritabanında satır düzeyinde güvenlik vardır: her birim yalnızca kendisine yönlendirilen bildirimleri görür.",
  "Giriş yalnızca @sakarya.edu.tr adresleriyle yapılabilir.",
];

const RIGHTS = [
  "Kişisel verilerinin işlenip işlenmediğini öğrenme ve bilgi isteme",
  "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
  "Yurt içinde ve yurt dışında aktarıldığı üçüncü kişileri bilme",
  "Eksik ya da yanlış işlenmişse düzeltilmesini isteme",
  "Silinmesini ya da yok edilmesini isteme ve bunun aktarılan kişilere bildirilmesini isteme",
  "Otomatik sistemlerle analiz sonucu aleyhine bir sonuç çıkmasına itiraz etme",
  "Kanuna aykırı işleme nedeniyle zarara uğrarsan zararın giderilmesini isteme",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-hairline pt-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function KvkkPage() {
  return (
    <main id="icerik" className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-5 py-12 text-[15px] leading-7 text-ink/90">
      <header className="flex flex-col gap-3">
        <Link href="/giris" className="w-fit text-sm text-accent focus-ring">
          Girişe dön
        </Link>
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">Kişisel verilerin korunması</h1>
        <p className="text-muted">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) 10. madde kapsamında Çözüm Kampüs aydınlatma metni.
        </p>
      </header>

      <Section title="Veri sorumlusu">
        <p>
          Pilot süresince veri sorumlusu Çözüm Kampüs proje ekibidir. Uygulama üniversitede kalıcı olarak kullanıma alındığında veri
          sorumlusu Sakarya Üniversitesi olur ve bu metin güncellenir.
        </p>
      </Section>

      <Section title="Hangi verileri işliyoruz">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[180px_1fr]">
          {DATA.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold text-ink">{k}</dt>
              <dd className="mb-2 text-muted sm:mb-0">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Amaç ve hukuki sebep">
        <p>
          Verilerin kampüsteki arızaları doğru birime iletmek, çözüm sürecini sana bildirmek, önerilere yanıt vermek ve hizmet
          kalitesini ölçmek için işlenir. Hukuki sebep KVKK 5/2-e (bir hakkın tesisi ve kullanılması) ve 5/2-f (veri
          sorumlusunun meşru menfaati) hükümleridir. Konum paylaşımı isteğe bağlıdır ve yalnızca sen “Konumumu kullan” dersen alınır.
        </p>
      </Section>

      <Section title="Aldığımız önlemler">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {SAFEGUARDS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section title="Aktarım">
        <p>
          Uygulama bulut hizmetleri üzerinde çalışır: veritabanı ve dosyalar Supabase, web uygulaması Vercel, yapay zeka servisi
          Render üzerindedir. Fotoğraf ve maskelenmiş açıklama, sınıflandırma için Google Gemini modeline gönderilir. Bu
          sunucuların bir kısmı yurt dışındadır; yurt dışına aktarım KVKK 9. madde kapsamındadır. Kalıcı kullanımda veritabanının
          yurt içine taşınması ya da üniversite sunucusunda çalışan bir modele geçilmesi planlanmıştır; yapay zeka katmanı bunun
          için tek bir arayüzün arkasında tutulur.
        </p>
      </Section>

      <Section title="Saklama süresi">
        <p>
          Bildirimler ve öneriler hizmet kalitesi raporları için akademik yıl boyunca saklanır, sonra anonimleştirilir. Hesabını
          silmek istersen kişisel verilerin silinir, açtığın bildirimler anonim olarak kalır.
        </p>
      </Section>

      <Section title="Hakların (KVKK 11. madde)">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {RIGHTS.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="text-muted">
          Başvurunu okul e-posta adresinden proje ekibine iletebilirsin; en geç 30 gün içinde yanıtlanır.
        </p>
      </Section>
    </main>
  );
}
