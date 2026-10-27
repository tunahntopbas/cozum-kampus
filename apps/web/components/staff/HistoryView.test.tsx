import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoryView, type HistoryRecord } from "./HistoryView";

const NOW = Date.parse("2026-10-28T12:00:00Z");

function record(over: Partial<HistoryRecord>): HistoryRecord {
  return {
    id: 1,
    title: "Koridor lambası yanmıyor",
    place: "Mühendislik Fakültesi, Zemin kat",
    resolvedAt: "2026-10-28T10:00:00Z",
    minutes: 30,
    confidence: 92,
    resolved: true,
    reopened: false,
    note: "Lamba değiştirildi",
    beforeUrl: null,
    afterUrl: null,
    steps: [{ label: "Bildirim alındı", at: "2026-10-28T09:00:00Z" }],
    ...over,
  };
}

const records = [
  record({}),
  record({ id: 2, title: "Musluk damlatıyor", minutes: 50, confidence: 40, resolved: false, note: null }),
  record({ id: 3, title: "Priz çalışmıyor", reopened: true, minutes: null, confidence: null, resolved: null }),
  record({ id: 4, title: "Eski iş", resolvedAt: "2026-09-01T10:00:00Z", minutes: 10 }),
];

describe("HistoryView", () => {
  it("computes stats for the selected period", () => {
    render(<HistoryView records={records} now={NOW} />);
    const stat = (label: string) => screen.getByLabelText(label);
    expect(stat("Tamamlanan")).toHaveTextContent("3");
    expect(stat("Ortalama süre")).toHaveTextContent("40 dk");
    expect(stat("Yapay zeka doğrulaması")).toHaveTextContent("%50");
    expect(stat("Yeniden açılan")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Tümü" }));
    expect(screen.getByRole("button", { name: "Eski iş" })).toBeInTheDocument();
  });

  it("filters, searches and shows the selected job's detail", () => {
    render(<HistoryView records={records} now={NOW} />);
    const detail = () => screen.getByRole("region", { name: "Geçmiş iş detayı" });
    expect(within(detail()).getByText("Lamba değiştirildi")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("İş durumu"), { target: { value: "review" } });
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
    expect(within(detail()).getByText(/Yapay zeka doğrulayamadı, %40/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("İş durumu"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: "yok böyle" } });
    expect(screen.getByText("Bu filtrelere uygun iş yok.")).toBeInTheDocument();
  });

  it("shows an empty state without records", () => {
    render(<HistoryView records={[]} now={NOW} />);
    expect(screen.getByText("Henüz tamamlanan iş yok.")).toBeInTheDocument();
  });
});
