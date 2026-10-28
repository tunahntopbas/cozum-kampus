"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle, NavigationArrow, Swap } from "@phosphor-icons/react";
import { Photo, Pill, Stats } from "@/components/staff-demo/Shared";
import { AiRequestError, verifyResolution, type VerifyResult } from "@/lib/ai";
import { relativeTime } from "@/lib/campus";
import { prepareImage } from "@/lib/image";
import { categoryLabel, urgencyLabel } from "@/lib/labels";
import { JOB_STEPS, completedSteps, nextAction } from "@/lib/staff";
import { statusMeta, type ReportStatus } from "@/lib/status";
import { createClient } from "@/lib/supabase/client";
import { uploadReportImage } from "@/lib/upload";
import s from "@/components/staff-demo/Staff.module.css";
import type { StaffJob } from "./types";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircle as CheckCircleIcon_ } from "@phosphor-icons/react";
import { SheetPanes } from "@/components/layout/Panes";

type Props = {
  staffId: string;
  staffName: string;
  unitName: string;
  jobs: StaffJob[];
  completedToday: { id: number; title: string; resolvedAt: string }[];
  units: { id: number; name: string }[];
  ownUnitId: number | null;
};

const TONE = { acil: "red", orta: "amber", dusuk: "grey" } as const;
const TODAY = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "Europe/Istanbul" });

export function StaffJobsView({ staffId, staffName, unitName, jobs, completedToday, units, ownUnitId }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(jobs[0]?.id ?? null);
  const [verdicts, setVerdicts] = useState<Record<number, VerifyResult>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState(false);
  const otherUnits = units.filter((u) => u.id !== ownUnitId);
  const [toUnit, setToUnit] = useState<number | null>(otherUnits[0]?.id ?? null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const job = jobs.find((j) => j.id === selectedId) ?? jobs[0];
  const verdict = job ? verdicts[job.id] : undefined;
  const action = job ? nextAction(job.status) : null;

  function select(id: number) {
    setSelectedId(id);
    setHandoff(false);
    setReason("");
    setNote("");
    setError(null);
    setMessage(null);
  }

  async function run(work: () => Promise<string | null>, done?: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const failure = await work();
      if (failure) setError(failure);
      else {
        if (done) setMessage(done);
        router.refresh();
      }
    } catch {
      setError("İşlem tamamlanamadı. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(j: StaffJob, to: ReportStatus, payload: Record<string, unknown> = {}) {
    const supabase = createClient();
    const patch = to === "cozuldu" ? { status: to, resolved_at: new Date().toISOString() } : { status: to };
    const { error: updateError } = await supabase.from("reports").update(patch).eq("id", j.id);
    if (updateError) return "Durum güncellenemedi.";
    await supabase.from("report_events").insert({ report_id: j.id, type: "durum", actor_id: staffId, payload: { to, ...payload } });
    return null;
  }

  function uploadSolution(j: StaffJob, file: File) {
    run(async () => {
      const supabase = createClient();
      const path = await uploadReportImage(staffId, await prepareImage(file));
      const { error: mediaError } = await supabase.from("report_media").insert({ report_id: j.id, kind: "sonra", storage_path: path });
      if (mediaError) return "Fotoğraf bildirime eklenemedi.";
      if (!j.beforePath) {
        setVerdicts((v) => ({ ...v, [j.id]: { resolved: false, confidence: 0, note: "Öğrencinin fotoğrafı yok, karşılaştırma yapılmadı.", ai_pending: true } }));
        return null;
      }
      const { data } = await supabase.auth.getSession();
      try {
        const result = await verifyResolution(
          { beforePath: j.beforePath, afterPath: path, category: j.category },
          data.session?.access_token ?? "",
        );
        setVerdicts((v) => ({ ...v, [j.id]: result }));
      } catch (e) {
        if (e instanceof AiRequestError && e.status === 403) return "Bu işlem yalnızca birim personeli içindir.";
        throw e;
      }
      return null;
    });
  }

  function complete(j: StaffJob) {
    run(
      () => setStatus(j, "cozuldu", { note: note.trim() || undefined, ai: verdicts[j.id] ?? null }),
      "İş tamamlandı. Öğrenci bildiriminde durum Çözüldü olarak görünür.",
    );
  }

  function submitHandoff(j: StaffJob) {
    if (!reason.trim() || toUnit == null) {
      setError("Devralacak birimi seç ve devir nedenini yaz.");
      return;
    }
    run(async () => {
      const { data, error: rpcError } = await createClient().rpc("handoff_report", { rid: j.id, to_unit: toUnit, reason });
      if (rpcError || !data) return "İş devredilemedi. Durumu değişmiş olabilir, sayfayı yenile.";
      setHandoff(false);
      setSelectedId(null);
      return null;
    }, "İş devredildi.");
  }

  const done = job ? completedSteps(job.status, Boolean(job.afterUrl)) : 0;
  const urgent = jobs.filter((j) => j.urgency === "acil").length;

  return (
    <>
      <header className={s.header}>
        <h1>Bugünkü işler</h1>
        <p>
          {staffName} · {unitName} · {TODAY.format(new Date())}. Sıra aciliyete ve bildirim saatine göre.
        </p>
      </header>
      <Stats
        items={[
          ["Kalan iş", jobs.length, urgent ? `${urgent} tanesi acil` : "Acil iş yok"],
          ["Tamamlanan", completedToday.length, "Bugün"],
          ["Biriminde", unitName, "Bildirimler bu birime yönlendirildi"],
          ["Bekleyen ilk iş", jobs[0] ? relativeTime(jobs[0].createdAt) : "Yok", "En eski açık bildirimden beri"],
        ]}
      />
      <SheetPanes className={s.jobs} openOn={`.${s.job}`} label="İş detayını">
        <div className={s.stack}>
          <section className={`glass ${s.compact}`} aria-label="Rota sırası">
            <div className={s.heading}>
              <h2>Rota sırası</h2>
            </div>
            {!jobs.length && (
              <EmptyState icon={<CheckCircleIcon_ size={22} />} title="Biriminde açık iş yok." hint="Yeni bildirim birimine yönlendirilince burada sıraya girer." />
            )}
            <ol className={s.list} aria-label="Bugünkü işler">
              {jobs.map((j, index) => (
                <li key={j.id}>
                  <button type="button" className={s.job} aria-pressed={j.id === job?.id} onClick={() => select(j.id)}>
                    <span className={s.number}>{index + 1}</span>
                    <span className={s.jobText}>
                      <strong>{j.title}</strong>
                      <small>{j.place}</small>
                      {j.category === "asansor_erisilebilirlik" && <Pill>Erişilebilirlik</Pill>}
                    </span>
                    <span className={s.end}>
                      <Pill tone={TONE[j.urgency]}>{urgencyLabel(j.urgency)}</Pill>
                      <small className={s.muted}>{statusMeta(j.status).label}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section className={`glass ${s.compact}`} aria-label="Tamamlananlar">
            <div className={s.heading}>
              <h2>
                Tamamlananlar <span className={s.muted}>{completedToday.length}</span>
              </h2>
            </div>
            <ul className={s.list}>
              {completedToday.map((c) => (
                <li key={c.id} className={s.completed}>
                  <CheckCircle size={20} aria-hidden />
                  <span>{c.title}</span>
                  <small>{relativeTime(c.resolvedAt)}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {job ? (
          <section className={`glass ${s.panel}`} aria-label="İş detayı">
            <div className={s.heading}>
              <div>
                <p className={s.meta}>
                  #{job.id} · {job.place}
                </p>
                <h3>{job.title}</h3>
                <div className={s.tags}>
                  <Pill tone={TONE[job.urgency]}>Aciliyet {urgencyLabel(job.urgency).toLocaleLowerCase("tr")}</Pill>
                  <Pill>{categoryLabel(job.category)}</Pill>
                  <Pill>{job.voteCount} kişi bildirdi</Pill>
                </div>
              </div>
              <div className={s.actions}>
                {job.buildingLat != null && job.buildingLng != null && (
                  <a
                    className={s.button}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.buildingLat},${job.buildingLng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NavigationArrow size={16} aria-hidden />
                    Rota
                  </a>
                )}
                <button
                  type="button"
                  className={s.button}
                  disabled={busy || !otherUnits.length}
                  onClick={() => setHandoff((v) => !v)}
                  aria-expanded={handoff}
                >
                  <Swap size={16} aria-hidden />
                  Devret
                </button>
              </div>
            </div>
            <p className={s.muted}>Durum: {statusMeta(job.status).label}</p>

            {handoff && (
              <form
                className={s.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  submitHandoff(job);
                }}
              >
                <label>
                  Devralacak birim
                  <select className={s.input} value={toUnit ?? ""} onChange={(e) => setToUnit(Number(e.target.value))}>
                    {otherUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Devir nedeni
                  <textarea className={s.input} value={reason} onChange={(e) => setReason(e.target.value)} required />
                </label>
                <div className={s.actions}>
                  <button className={s.primary} disabled={busy}>
                    Devret
                  </button>
                  <button type="button" className={s.button} onClick={() => setHandoff(false)}>
                    Vazgeç
                  </button>
                </div>
              </form>
            )}

            <ol className={s.steps} aria-label="İş adımları">
              {JOB_STEPS.map((step, i) => (
                <li key={step}>
                  <span className={`${s.step} ${i < done ? s.stepDone : ""}`}>
                    {i < done ? <Check size={16} aria-hidden /> : i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className={s.photos}>
              <div className={s.photoCol}>
                <h3>Öğrencinin fotoğrafı</h3>
                <Photo label={job.beforeUrl ? "Bildirim fotoğrafı" : "Fotoğraf eklenmemiş"} src={job.beforeUrl ?? undefined} alt="Öğrencinin bildirim fotoğrafı" placeholder="Fotoğraf yok" />
                {job.aiSummary && (
                  <div className={s.summary}>
                    <strong>Yapay zeka özeti</strong>
                    {job.aiSummary}
                  </div>
                )}
              </div>
              <div className={s.photoCol}>
                <h3>Çözüm fotoğrafı</h3>
                <Photo label={job.afterUrl ? "Yüklendi" : "Henüz yüklenmedi"} src={job.afterUrl ?? undefined} alt="Çözüm fotoğrafı" placeholder="Fotoğraf yok" />
                <label className={s.muted}>
                  {busy ? "Yükleniyor ve doğrulanıyor" : "Çözüm fotoğrafı yükle"}
                  <input
                    key={job.id}
                    className={s.upload}
                    type="file"
                    accept="image/*"
                    disabled={busy || job.status !== "islemde"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) uploadSolution(job, file);
                    }}
                  />
                </label>
                {job.status !== "islemde" && <p className={s.muted}>İşe başladıktan sonra yüklenebilir.</p>}
                {verdict && (
                  <p role="status" className={s.notice}>
                    {verdict.ai_pending
                      ? verdict.note
                      : `${verdict.resolved ? "Yapay zeka sorunun giderildiğini doğruladı" : "Yapay zeka sorunun giderildiğini doğrulayamadı"} (%${Math.round(verdict.confidence * 100)}). ${verdict.note}`}
                  </p>
                )}
              </div>
            </div>

            {job.status === "islemde" && (
              <label className={s.form}>
                <strong className="lbl">
                  Yapılan işlem <span className={s.muted}>isteğe bağlı</span>
                </strong>
                <input aria-label="Yapılan işlem" className={s.input} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            )}
            {error && (
              <p role="alert" className={s.notice}>
                {error}
              </p>
            )}
            {message && (
              <p role="status" className={s.notice}>
                {message}
              </p>
            )}
            <div className={s.footer}>
              <p>Öğrenci her adımı Bildirimlerim ekranında anlık görür.</p>
              {action ? (
                <button
                  className={s.primary}
                  disabled={busy}
                  onClick={() => run(() => setStatus(job, action.to))}
                >
                  {action.label}
                </button>
              ) : job.status === "islemde" ? (
                <button className={s.primary} disabled={busy || !job.afterUrl} onClick={() => complete(job)}>
                  <Check size={20} aria-hidden />
                  {verdict && !verdict.resolved && !verdict.ai_pending ? "Yine de tamamla" : "İşi tamamla"}
                </button>
              ) : null}
            </div>
          </section>
        ) : (
          <section className={`glass ${s.panel}`} aria-label="İş detayı">
            <p className={s.muted}>{message ?? "Seçili iş yok."}</p>
          </section>
        )}
      </SheetPanes>
    </>
  );
}
