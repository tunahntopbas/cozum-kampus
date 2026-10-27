"use client";

import { useState } from "react";
import { CheckCircle, PencilSimple, Sparkle, WarningCircle } from "@phosphor-icons/react";
import type { ReportAnalysis } from "@/lib/ai";
import {
  CATEGORIES,
  categoryLabel,
  resolutionEstimate,
  unitLabel,
  urgencyLabel,
  type Category,
} from "@/lib/labels";

export type AnalysisState = "idle" | "loading" | "done";

const URGENCY_BARS = { dusuk: 1, orta: 2, acil: 3 } as const;
const BAR_COLOR = { dusuk: "#16A34A", orta: "#D97706", acil: "#B91C1C" } as const;

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${last ? "" : "border-b border-hairline"}`}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="flex items-center gap-2 text-right text-sm font-semibold">{children}</dd>
    </div>
  );
}

function StatePill({ state, pending }: { state: AnalysisState; pending: boolean }) {
  if (state === "loading") return <span className="pill bg-status-islemde-bg text-status-islemde-fg">Analiz ediliyor</span>;
  if (state === "done" && pending) return <span className="pill bg-status-alindi-bg text-status-alindi-fg">Bekleniyor</span>;
  if (state === "done") return <span className="pill bg-status-cozuldu-bg text-status-cozuldu-fg">Tamamlandı</span>;
  return null;
}

type Props = { state: AnalysisState; analysis: ReportAnalysis | null; onCategoryChange: (c: Category) => void };

export function AnalysisPanel({ state, analysis, onCategoryChange }: Props) {
  const [editing, setEditing] = useState(false);
  const pending = Boolean(analysis?.ai_pending);

  return (
    <section aria-label="Yapay zeka analizi" aria-live="polite" className="glass flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-tint">
            <Sparkle size={20} weight="fill" aria-hidden />
          </span>
          <h2 className="text-xl font-semibold">Yapay zeka analizi</h2>
        </div>
        <StatePill state={state} pending={pending} />
      </div>

      {!analysis && (
        <p className="text-sm text-muted">
          {state === "loading"
            ? "Fotoğraf ve açıklama inceleniyor."
            : "Bir fotoğraf ekle ya da sorunu yaz; kategori, aciliyet ve birim burada görünür."}
        </p>
      )}

      {analysis && pending && (
        <p className="text-sm text-muted">İçerik denetimi tamamlanamadı. Bildirim henüz paylaşılamaz. Biraz bekleyip açıklamayı düzenleyerek yeniden dene.</p>
      )}

      {analysis && (
        <>
          <dl className="flex flex-col">
            <Row label="Kategori">
              {editing ? (
                <select
                  aria-label="Kategori"
                  value={analysis.category}
                  onChange={(e) => {
                    onCategoryChange(e.target.value as Category);
                    setEditing(false);
                  }}
                  className="rounded-lg border border-input-border bg-white px-2 py-1 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              ) : (
                categoryLabel(analysis.category)
              )}
            </Row>
            <Row label="Aciliyet">
              <span aria-hidden="true" className="flex gap-0.5">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className="block h-2 w-4 rounded-sm"
                    style={{
                      background: n <= URGENCY_BARS[analysis.urgency] ? BAR_COLOR[analysis.urgency] : "#E5E7EB",
                    }}
                  />
                ))}
              </span>
              {urgencyLabel(analysis.urgency)}
            </Row>
            <Row label="Sorumlu birim">{unitLabel(analysis.unit)}</Row>
            <Row label="Tahmini çözüm">{resolutionEstimate(analysis.urgency)}</Row>
            {!pending && (
              <Row label="İçerik denetimi">
                {analysis.moderation.ok ? (
                  <span className="flex items-center gap-2 text-status-cozuldu-fg">
                    <CheckCircle size={16} weight="fill" aria-hidden />
                    Uygun
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-danger">
                    <WarningCircle size={16} weight="fill" aria-hidden />
                    Uygun değil
                  </span>
                )}
              </Row>
            )}
            <Row label="Güven oranı" last>
              <span className="mono">{pending ? "Bekleniyor" : `%${Math.round(analysis.confidence * 100)}`}</span>
            </Row>
          </dl>
          {analysis.summary && <p className="text-sm text-muted">{analysis.summary}</p>}
          {analysis.is_sensitive && (
            <p className="rounded-lg bg-tint p-3 text-sm">Bu bildirim gizlilikle güvenlik birimine iletilecek.</p>
          )}
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ghost t flex items-center gap-2 self-start rounded-lg border border-input-border bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              <PencilSimple size={16} aria-hidden />
              Kategoriyi düzenle
            </button>
          )}
        </>
      )}
    </section>
  );
}
