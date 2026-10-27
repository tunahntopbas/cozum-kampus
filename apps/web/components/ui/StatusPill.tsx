import { statusMeta, type ReportStatus, type StatusTone } from "@/lib/status";

const TONE_CLASS: Record<StatusTone, string> = {
  alindi: "bg-status-alindi-bg text-status-alindi-fg",
  islemde: "bg-status-islemde-bg text-status-islemde-fg",
  cozuldu: "bg-status-cozuldu-bg text-status-cozuldu-fg",
};

export function StatusPill({ status }: { status: ReportStatus }) {
  const { label, tone } = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}
