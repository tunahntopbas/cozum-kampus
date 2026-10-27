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

  it("switches between monthly and weekly jobs and recomputes period stats", () => {
    const monthlyJob = record({ id: 5, title: "Aylık iş", resolvedAt: "2026-10-10T10:00:00Z", minutes: 80 });
    render(<HistoryView records={[...records, monthlyJob]} now={NOW} />);
    const table = () => within(screen.getByRole("table", { name: "Geçmiş işler" }));
    expect(table().queryByRole("button", { name: "Aylık iş" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bu ay" }));
    expect(screen.getByRole("button", { name: "Bu ay" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bu hafta" })).toHaveAttribute("aria-pressed", "false");
    expect(table().getByRole("button", { name: "Aylık iş" })).toBeInTheDocument();
    expect(table().queryByRole("button", { name: "Eski iş" })).not.toBeInTheDocument();
    expect(table().getAllByRole("row")).toHaveLength(5);
    expect(screen.getByLabelText("Tamamlanan")).toHaveTextContent(/^4$/);
    expect(screen.getByLabelText("Ortalama süre")).toHaveTextContent("53 dk");
    fireEvent.click(table().getByRole("button", { name: "Aylık iş" }));

    fireEvent.click(screen.getByRole("button", { name: "Bu hafta" }));
    expect(screen.getByRole("button", { name: "Bu hafta" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Bu ay" })).toHaveAttribute("aria-pressed", "false");
    expect(table().queryByRole("button", { name: "Aylık iş" })).not.toBeInTheDocument();
    expect(table().getAllByRole("row")).toHaveLength(4);
    expect(screen.getByLabelText("Tamamlanan")).toHaveTextContent(/^3$/);
    expect(screen.getByLabelText("Ortalama süre")).toHaveTextContent("40 dk");
    expect(within(screen.getByRole("region", { name: "Geçmiş iş detayı" })).getByRole("heading", { name: records[0].title })).toBeInTheDocument();
  });

  it.each([
    ["title", "PRİZ", "Priz çalışmıyor", 3],
    ["number", "218", "Musluk damlatıyor", 218],
    ["place", "KÜTÜPHANE", "Musluk damlatıyor", 218],
  ] as const)("finds a job by %s and shows its detail", (_field, query, title, id) => {
    const searchable = [records[0], record({ id: 218, title: "Musluk damlatıyor", place: "Kütüphane, 3. kat" }), records[2]];
    render(<HistoryView records={searchable} now={NOW} />);
    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: query } });
    const table = within(screen.getByRole("table", { name: "Geçmiş işler" }));
    expect(table.getAllByRole("row")).toHaveLength(2);
    expect(table.getByRole("button", { name: title })).toHaveAttribute("aria-pressed", "true");
    const detail = within(screen.getByRole("region", { name: "Geçmiş iş detayı" }));
    expect(detail.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(detail.getByText(new RegExp(`^#${id} ·`))).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: "" } });
    expect(table.getAllByRole("row")).toHaveLength(4);
  });

  it("filters reopened jobs and combines the filter with search", () => {
    render(<HistoryView records={records} now={NOW} />);
    fireEvent.change(screen.getByLabelText("İş durumu"), { target: { value: "reopened" } });
    const table = () => within(screen.getByRole("table", { name: "Geçmiş işler" }));
    expect(table().getAllByRole("row")).toHaveLength(2);
    expect(table().getByRole("button", { name: "Priz çalışmıyor" })).toHaveAttribute("aria-pressed", "true");
    expect(table().getByText("Yeniden açıldı")).toBeInTheDocument();
    expect(table().queryByRole("button", { name: "Musluk damlatıyor" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Geçmiş iş detayı" })).getByRole("heading", { name: "Priz çalışmıyor" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: "Musluk" } });
    expect(screen.getByText("Bu filtrelere uygun iş yok.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Geçmiş iş detayı" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("İş durumu"), { target: { value: "all" } });
    expect(table().getByRole("button", { name: "Musluk damlatıyor" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: "" } });
    expect(table().getAllByRole("row")).toHaveLength(4);
  });

  it("selects another row and replaces the detail, photos, note and timeline", () => {
    const second = record({
      id: 218,
      title: "Musluk damlatıyor",
      place: "Kütüphane, 3. kat",
      confidence: 40,
      resolved: false,
      note: "Conta değiştirildi",
      beforeUrl: "https://example.com/tap-before.jpg",
      afterUrl: "https://example.com/tap-after.jpg",
      steps: [{ label: "Conta kontrol edildi", at: "2026-10-28T08:15:00Z" }],
    });
    render(<HistoryView records={[records[0], second]} now={NOW} />);
    const firstButton = screen.getByRole("button", { name: records[0].title });
    const secondButton = screen.getByRole("button", { name: second.title });
    expect(firstButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(secondButton);
    expect(firstButton).toHaveAttribute("aria-pressed", "false");
    expect(secondButton).toHaveAttribute("aria-pressed", "true");
    const detail = () => within(screen.getByRole("region", { name: "Geçmiş iş detayı" }));
    expect(detail().getByRole("heading", { name: second.title })).toBeInTheDocument();
    expect(detail().getByText("#218 · Kütüphane, 3. kat")).toBeInTheDocument();
    expect(detail().getByText("Conta değiştirildi")).toBeInTheDocument();
    expect(detail().queryByText("Lamba değiştirildi")).not.toBeInTheDocument();
    expect(detail().getByRole("img", { name: "Öğrencinin bildirim fotoğrafı" })).toHaveAttribute("src", second.beforeUrl);
    expect(detail().getByRole("img", { name: "Çözüm fotoğrafı" })).toHaveAttribute("src", second.afterUrl);
    const timeline = within(detail().getByRole("list", { name: "İş akışı" }));
    expect(timeline.getByText("Conta kontrol edildi")).toBeInTheDocument();
    expect(timeline.getByText(/Yapay zeka doğrulayamadı, %40/)).toBeInTheDocument();
    expect(timeline.queryByText("Bildirim alındı")).not.toBeInTheDocument();

    fireEvent.click(firstButton);
    expect(detail().getByRole("heading", { name: records[0].title })).toBeInTheDocument();
    expect(detail().getByText("Lamba değiştirildi")).toBeInTheDocument();
    expect(detail().queryByText("Conta değiştirildi")).not.toBeInTheDocument();
    expect(detail().queryByRole("img")).not.toBeInTheDocument();
    expect(detail().getByText(/Yapay zeka doğruladı, %92/)).toBeInTheDocument();
  });

  it("shows an empty state without records", () => {
    render(<HistoryView records={[]} now={NOW} />);
    expect(screen.getByText("Henüz tamamlanan iş yok.")).toBeInTheDocument();
  });
});
