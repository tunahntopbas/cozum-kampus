"use client";

import { useState } from "react";
import { ChartLineUp, Drop, Lightbulb, ShieldWarning, Sparkle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { units } from "./data";
import { Filters, Kpis } from "./ui";
import s from "./admin.module.css";

export function Overview() {
  const [period, setPeriod] = useState("Bu hafta");
  const [category, setCategory] = useState("Tümü");
  const [fullReport, setFullReport] = useState(false);
  const [security, setSecurity] = useState(false);
  const stats = period === "Bugün" ? ["9", "1,8 gün", "%90", "4,4 / 5"] : period === "Bu ay" ? ["64", "2,7 gün", "%85", "4,1 / 5"] : ["28", "2,4 gün", "%87", "4,2 / 5"];
  const heat = category === "Tümü" ? [11, 7, 5] : category === "Aydınlatma" ? [8, 2, 1] : category === "Su" ? [1, 4, 3] : [3, 1, 0];
  return <>
    <div className={s.row}><PageHeader title="Genel bakış" description="Sakarya Üniversitesi · 27 Ekim 2026, Salı · Demo görünümü" /><Filters label="Zaman aralığı" options={["Bugün", "Bu hafta", "Bu ay"]} value={period} onChange={setPeriod} /></div>
    <section aria-label="Güvenlik uyarısı" className={`${s.security} ${s.row}`}>
      <ShieldWarning size={32} aria-hidden /><div className="min-w-0 flex-1"><h2 className="font-semibold">Hassas bildirim akışı · Demo</h2><p className="text-sm">Yetkili birime özel uyarı alanının örnek gösterimi. Gerçek hassas kayıt içermez.</p></div>
      <Button variant="danger" aria-expanded={security} onClick={() => setSecurity(!security)}>İncele</Button>
      {security && <p className="w-full text-sm">Demo inceleme: Kimlik veya olay detayı gösterilmez. Gerçek güvenlik kanalına erişim ya da işlem yapılmadı.</p>}
    </section>
    <Kpis items={[
      { label: "Açık bildirim", value: stats[0], hint: `${period} · Örnek gösterge`, accessibleLabel: "Açık bildirim sayısı" },
      { label: "Ortalama çözüm süresi", value: stats[1], hint: "Önceki döneme göre −0,3 gün" },
      { label: "Süresinde çözülen", value: stats[2], hint: "Hedef %90" },
      { label: "Öğrenci memnuniyeti", value: stats[3], hint: "Örnek çözüm değerlendirmeleri" },
    ]} />
    <div className={s.split}>
      <Glass className={`${s.panel} ${s.stack}`}>
        <div><h2>Isı haritası</h2><p className={s.muted}>Açık bildirimlerin bölgelere göre yoğunluğu · {period}</p></div>
        <Filters label="Kategori" options={["Tümü", "Aydınlatma", "Su", "Asansör"]} value={category} onChange={setCategory} />
        <svg role="img" aria-label={`${category} kategorisi ısı haritası: Mühendislik ${heat[0]}, Yurtlar ${heat[1]}, Yemekhane ${heat[2]} örnek bildirim`} className={s.map} viewBox="0 0 620 360">
          <defs><radialGradient id="admin-heat"><stop stopColor="#b91c1c" stopOpacity=".7"/><stop offset=".5" stopColor="#d97706" stopOpacity=".4"/><stop offset="1" stopColor="#d97706" stopOpacity="0"/></radialGradient></defs>
          <rect width="620" height="360" fill="#e9eef5"/><rect x="440" y="20" width="140" height="85" rx="12" fill="#d9e8df"/>
          <g fill="none" stroke="#fff" strokeWidth="18"><path d="M0 145H620M0 295H620M185 0V360M420 0V360"/></g>
          <g fill="#dae2ee" stroke="#bac7da"><rect x="35" y="40" width="120" height="70" rx="4"/><rect x="225" y="35" width="150" height="80" rx="4"/><rect x="35" y="190" width="110" height="65" rx="4"/><rect x="245" y="195" width="125" height="65" rx="4"/><rect x="460" y="190" width="120" height="70" rx="4"/></g>
          {[[300,80],[90,220],[520,220]].map(([cx,cy], index) => <circle key={index} cx={cx} cy={cy} r={heat[index] ? 30 + heat[index] * 4 : 0} fill="url(#admin-heat)"/>)}
          <text x="235" y="85">Mühendislik · {heat[0]}</text><text x="45" y="225">Yurtlar · {heat[1]}</text><text x="460" y="225">Yemekhane · {heat[2]}</text><text x="45" y="80">Kütüphane</text>
        </svg>
        <p className={s.small}>Az <span aria-hidden className="mx-2 inline-block h-2 w-20 rounded bg-gradient-to-r from-amber-200 via-amber-600 to-red-700" /> Çok · Şematik demo haritası</p>
      </Glass>
      <Glass className={`${s.panel} ${s.stack}`}>
        <div className={s.row}><div><h2>Haftalık özet</h2><p className={`${s.muted} flex items-center gap-1`}><Sparkle size={16} aria-hidden /> Demo AI özeti · Hazır örnek</p></div><span className={s.small}>20 – 27 Eki</span></div>
        <ul className={s.stack}>
          <li className="flex gap-3 text-sm"><Lightbulb size={28} className="shrink-0 rounded bg-red-100 p-1 text-red-800" aria-hidden /><p>Mühendislik Fakültesi aydınlatma bildirimleri <strong>%40 arttı</strong>. Toplu armatür bakımı önerilir.</p></li>
          <li className="flex gap-3 text-sm"><Drop size={28} className="shrink-0 rounded bg-amber-100 p-1 text-amber-800" aria-hidden /><p>Yemekhane girişinde su birikmesi için önleyici ekip planlanabilir.</p></li>
          <li className="flex gap-3 text-sm"><ChartLineUp size={28} className="shrink-0 rounded bg-red-100 p-1 text-red-800" aria-hidden /><p>Asansör arızaları geçen haftanın <strong>2 katı</strong>. Tekrarlayan arızalar için kontrol önerilir.</p></li>
          <li className="flex gap-3 text-sm"><Sparkle size={28} className="shrink-0 rounded bg-tint p-1" aria-hidden /><p>Kütüphane saatlerinin uzatılması <strong>412</strong> örnek oyla en çok desteklenen öneri.</p></li>
        </ul>
        <p className={s.small}>Gerçek yapay zeka çağrısı yapılmadı. Bu metin örnek bir haftalık rapordur.</p>
        <Button variant="secondary" aria-expanded={fullReport} onClick={() => setFullReport(!fullReport)}>{fullReport ? "Raporu kapat" : "Tam raporu aç"}</Button>
        {fullReport && <div className={s.note}><h3>Demo haftalık rapor</h3><p>Öncelik: aydınlatma bakımı, su tahliyesi ve tekrarlayan asansör arızaları. Yapı İşleri için iş yükünün dengelenmesi önerilir. Sayılar örnek veri kümesine aittir.</p></div>}
      </Glass>
    </div>
    <Glass className={s.panel}><h2>Birim performansı</h2><p className={s.muted}>Birim hedefinin altında kalan süreler kırmızı gösterilir.</p>
      <table className={s.table}><caption className="sr-only">Örnek birim performansı</caption><thead><tr><th scope="col">Birim</th><th scope="col">Açık</th><th scope="col">Süre</th><th scope="col">Süresinde çözüm</th></tr></thead><tbody>{units.map((unit) => <tr key={unit.name}><th scope="row">{unit.name}</th><td className="mono">{unit.open}</td><td className="mono">{unit.days} gün</td><td><div className="flex items-center gap-2"><div className={`${s.bar} flex-1`}><span style={{ width: `${unit.sla}%`, background: unit.sla < 80 ? "#b91c1c" : undefined }} /></div><span className={`mono ${unit.sla < 80 ? "text-danger" : ""}`}>%{unit.sla}</span></div></td></tr>)}</tbody></table>
    </Glass>
  </>;
}
