import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { History } from "./History";
import { Materials } from "./Materials";

describe("personel demo", () => {
  it("filters history and clears stale details on empty results", () => {
    render(<History />);
    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: "musluk" } });
    fireEvent.click(screen.getByRole("button", { name: /Yemekhane musluk damlatıyor/ }));
    const details = screen.getByRole("region", { name: "Geçmiş iş detayı" });
    expect(within(details).getByText("Önce")).toBeVisible();
    expect(within(details).getByText("Sonra")).toBeVisible();
    expect(within(details).getByText("Musluk contası değiştirildi.")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Geçmişte ara"), { target: { value: "bulunamaz" } });
    expect(screen.getByText("Aramana uygun iş bulunamadı.")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Geçmiş iş detayı" })).not.toBeInTheDocument();
  });
  it("filters stock and creates only a local request", () => {
    render(<Materials />);
    fireEvent.change(screen.getByLabelText("Stokta ara"), { target: { value: "priz" } });
    expect(within(screen.getByRole("table", { name: "Depo stoğu" })).queryByText("Starter")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yeni talep" }));
    fireEvent.change(screen.getByLabelText("Malzeme seç"), { target: { value: "Silikon tüpü" } });
    fireEvent.change(screen.getByLabelText("Miktar"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Demo talep oluştur" }));
    expect(screen.getByRole("status")).toHaveTextContent("Demo talep eklendi; depoya iletilmedi");
    expect(within(screen.getByRole("region", { name: "Taleplerim" })).getByText("Silikon tüpü × 3")).toBeVisible();
  });
});

describe("personel demo edge cases", () => {
  it("shows reopened jobs only when their date is in the selected period", () => {
    render(<History />);
    fireEvent.change(screen.getByLabelText("İş durumu"), { target: { value: "reopened" } });
    expect(screen.getByText("Aramana uygun iş bulunamadı.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Bu ay" }));
    expect(screen.getByRole("button", { name: "Yemekhane girişinde su birikintisi" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Geçmiş iş detayı" })).toHaveTextContent("Öğrenci sorunun sürdüğünü bildirdi");
  });
  it("requests missing supplies once and preserves custom request notes", () => {
    render(<Materials />);
    const requests = screen.getByRole("region", { name: "Taleplerim" });
    fireEvent.click(screen.getByRole("button", { name: "Eksikleri depodan iste" }));
    expect(within(requests).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Demo taleplerine eklendi" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Yeni talep" }));
    fireEvent.change(screen.getByLabelText("Talep notu (isteğe bağlı)"), { target: { value: "2. kat için" } });
    fireEvent.click(screen.getByRole("button", { name: "Demo talep oluştur" }));
    expect(within(requests).getByText("2. kat için")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Stokta ara"), { target: { value: "yok" } });
    expect(screen.getByText("Aramana uygun malzeme bulunamadı.")).toBeVisible();
  });
});
