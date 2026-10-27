"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { PageHeading, Pill, Stats } from "@/components/staff-demo/Shared";
import s from "@/components/staff-demo/Staff.module.css";
import { REQUEST_COLUMNS, stockLevel, toRequest, type MaterialRequest, type NeededMaterial, type RequestRow, type StockItem } from "@/lib/staff";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package as PackageIcon_, Sparkle as SparkleIcon_, ClipboardText as ClipboardTextIcon_ } from "@phosphor-icons/react";

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
const REQUEST_STATUS: Record<string, [string, string]> = {
  onay_bekliyor: ["Onay bekliyor", "amber"],
  hazirlaniyor: ["Hazırlanıyor", ""],
  hazir: ["Hazır", "green"],
  reddedildi: ["Reddedildi", "red"],
};
const TONE = { Yeterli: ["green", "#15803d"], Düşük: ["amber", "#d97706"], Kritik: ["red", "#b91c1c"] } as const;

export function MaterialsView({
  staffId,
  stock,
  needed,
  activeJobs,
  initialRequests,
}: {
  staffId: string;
  stock: StockItem[];
  needed: NeededMaterial[];
  activeJobs: number;
  initialRequests: MaterialRequest[];
}) {
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState(initialRequests);
  const [open, setOpen] = useState(false);
  const [material, setMaterial] = useState(stock[0]?.id ?? 0);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const itemName = new Map(stock.map((i) => [i.id, i.name]));
  const matches = stock.filter((i) => i.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")));
  const critical = stock.filter((i) => stockLevel(i.qty, i.min).status === "Kritik");
  const pending = new Set(requests.filter((r) => r.status === "onay_bekliyor").map((r) => r.itemId));
  const missing = needed.filter((n) => n.itemId != null && !pending.has(n.itemId));

  async function send(rows: { item_id: number; qty: number; note: string | null }[]) {
    setBusy(true);
    setError("");
    const { data, error: err } = await createClient()
      .from("material_requests")
      .insert(rows.map((r) => ({ ...r, requester_id: staffId })))
      .select(REQUEST_COLUMNS);
    setBusy(false);
    if (err) {
      setError("Talep gönderilemedi. Tekrar dene.");
      return false;
    }
    setRequests((all) => [...(data as RequestRow[]).map(toRequest), ...all]);
    return true;
  }

  async function requestMissing() {
    const ok = await send(missing.map((n) => ({ item_id: n.itemId as number, qty: n.count, note: "Bugünkü işler için" })));
    if (ok) setMessage(`${missing.length} kalem depoya iletildi.`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(quantity);
    if (!Number.isInteger(n) || n < 1 || n > 999) {
      setError("1–999 arasında tam sayı gir.");
      return;
    }
    if (await send([{ item_id: material, qty: n, note: note.trim() || null }])) {
      setOpen(false);
      setQuantity("1");
      setNote("");
      setMessage("Talep depoya iletildi.");
    }
  }

  return (
    <>
      <PageHeading title="Malzeme">Bugünkü işlerine göre gereken malzeme, birim deposu ve taleplerin.</PageHeading>
      <Stats
        items={[
          ["Bugün gerekli", `${needed.length} kalem`, `${activeJobs} açık işe göre`],
          ["Depoda eşleşen", needed.filter((n) => n.itemId != null).length, "Stokta kayıtlı"],
          ["Bekleyen talep", pending.size, "Onay bekliyor"],
          ["Kritik stok", critical.length, critical[0]?.name ?? "Yok"],
        ]}
      />
      <div className={s.wide}>
        <section className={`glass ${s.compact}`} aria-label="Depo stoğu">
          <div className={s.heading}>
            <h2>Depo stoğu</h2>
            <span className={s.muted}>{stock.length} kalem</span>
          </div>
          <label>
            <span className="sr-only">Stokta ara</span>
            <input className={s.input} placeholder="Malzeme ara" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className={s.tableWrap}>
            <table className={s.table} aria-label="Depo stoğu">
              <thead>
                <tr>
                  <th scope="col">Malzeme</th>
                  <th scope="col">Stok</th>
                  <th scope="col">En az</th>
                  <th scope="col">Doluluk</th>
                  <th scope="col">Durum</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((item) => {
                  const level = stockLevel(item.qty, item.min);
                  const [tone, color] = TONE[level.status];
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="mono">{item.qty}</td>
                      <td className="mono">{item.min}</td>
                      <td>
                        <div className={s.bar} role="meter" aria-label={`${item.name} doluluk`} aria-valuenow={level.fill} aria-valuemin={0} aria-valuemax={100}>
                          <i style={{ width: `${level.fill}%`, background: color }} />
                        </div>
                      </td>
                      <td>
                        <Pill tone={tone}>{level.status}</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!matches.length && (
            <EmptyState icon={<PackageIcon_ size={22} />} title={stock.length ? "Aramana uygun malzeme bulunamadı." : "Biriminin deposunda kayıt yok."} hint={stock.length ? "Başka bir ad dene." : "Depo kayıtları yönetimden eklenir."} />
          )}
        </section>
        <div className={s.stack}>
          <section className={`glass ${s.panel}`} aria-label="Bugünkü malzeme">
            <div>
              <h2>Bugünkü malzeme</h2>
              <p className={s.muted}>Açık işlerdeki yapay zeka önerilerinden derlendi</p>
            </div>
            {needed.length ? (
              <ul className={s.list}>
                {needed.map((n) => (
                  <li className={s.stockRow} key={n.itemId ?? n.name}>
                    <span>{n.name}</span>
                    <div className={s.actions}>
                      <span className="mono">{n.count} iş</span>
                      {n.itemId == null ? (
                        <Pill tone="grey">Depoda yok</Pill>
                      ) : (
                        <Pill tone={n.available >= n.count ? "green" : "amber"}>Depoda {n.available}</Pill>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<SparkleIcon_ size={22} />} title="Açık işlerde malzeme önerisi yok." hint="Yapay zeka bildirimlere malzeme önerdikçe burada toplanır." />
            )}
            <button className={s.primary} disabled={busy || !missing.length} onClick={requestMissing}>
              {missing.length ? "Eksikleri depodan iste" : "Talepler iletildi"}
            </button>
          </section>
          <section className={`glass ${s.panel}`} aria-label="Taleplerim">
            <div className={s.heading}>
              <h2>Taleplerim</h2>
              <button
                className={s.button}
                disabled={!stock.length}
                onClick={() => {
                  setOpen(true);
                  setMessage("");
                  setError("");
                }}
                aria-expanded={open}
              >
                <Plus size={16} aria-hidden />
                Yeni talep
              </button>
            </div>
            {open && (
              <form className={s.form} onSubmit={submit}>
                <label>
                  Malzeme seç
                  <select className={s.input} value={material} onChange={(e) => setMaterial(Number(e.target.value))}>
                    {stock.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Miktar
                  <input className={s.input} type="number" min="1" max="999" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </label>
                <label>
                  Talep notu (isteğe bağlı)
                  <input className={s.input} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <div className={s.actions}>
                  <button className={s.primary} disabled={busy}>
                    Talep oluştur
                  </button>
                  <button type="button" className={s.button} onClick={() => setOpen(false)}>
                    Vazgeç
                  </button>
                </div>
              </form>
            )}
            {error && <p role="alert">{error}</p>}
            {requests.length ? (
              <ul className={s.list}>
                {requests.map((r) => {
                  const [label, tone] = REQUEST_STATUS[r.status] ?? [r.status, ""];
                  return (
                    <li className={s.request} key={r.id}>
                      <strong>
                        {itemName.get(r.itemId) ?? "Malzeme"} × {r.qty}
                      </strong>
                      {r.note && <p className={s.muted}>{r.note}</p>}
                      <div className={s.heading}>
                        <span className={s.muted}>{DATE.format(new Date(r.createdAt))}</span>
                        <Pill tone={tone}>{label}</Pill>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<ClipboardTextIcon_ size={22} />} title="Henüz talebin yok." hint="Yeni talep ile depodan malzeme iste." />
            )}
          </section>
        </div>
      </div>
      {message && (
        <p role="status" className={s.notice}>
          {message}
        </p>
      )}
    </>
  );
}
