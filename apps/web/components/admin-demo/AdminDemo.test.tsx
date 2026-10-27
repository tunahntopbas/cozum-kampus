import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Overview } from "./Overview";
import { Reports } from "./Reports";
import { Units } from "./Units";
import { CampusVoice } from "./CampusVoice";

describe("Yönetim demo etkileşimleri", () => {
  it("changes overview period and heatmap category", () => {
    render(<Overview />);
    fireEvent.click(screen.getByRole("button", { name: "Bugün" }));
    expect(screen.getByLabelText("Açık bildirim sayısı")).toHaveTextContent("9");
    fireEvent.click(screen.getByRole("button", { name: "Su" }));
    expect(screen.getByRole("img", { name: /Su.*ısı haritası/ })).toBeInTheDocument();
  });
  it("filters records, clears hidden details, and saves assignment and record-specific notes", () => {
    render(<Reports />);
    fireEvent.change(screen.getByLabelText("Bildirim ara"), { target: { value: "bulunmayan" } });
    expect(screen.getByText("Eşleşen bildirim bulunamadı.")).toBeInTheDocument();
    expect(screen.queryByLabelText("İç not")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Bildirim ara"), { target: { value: "2049" } });
    fireEvent.change(screen.getByLabelText("Sorumlu birim"), { target: { value: "Teknik Servis" } });
    fireEvent.change(screen.getByLabelText("İç not"), { target: { value: "Demo ekip kontrolü gerekiyor." } });
    fireEvent.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(screen.getByRole("status")).toHaveTextContent("yalnızca bu demo oturumunda");
    fireEvent.change(screen.getByLabelText("Bildirim ara"), { target: { value: "2041" } });
    expect(screen.getByLabelText("İç not")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Bildirim ara"), { target: { value: "2049" } });
    expect(screen.getByLabelText("İç not")).toHaveValue("Demo ekip kontrolü gerekiyor.");
    expect(screen.getByLabelText("Sorumlu birim")).toHaveValue("Teknik Servis");
  });
  it("combines urgency and unit filters", () => {
    render(<Reports />);
    fireEvent.click(screen.getByRole("button", { name: /^Acil/ }));
    expect(screen.queryByRole("button", { name: /Koridor lambası/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Birim filtresi"), { target: { value: "Temizlik" } });
    expect(screen.getByText("Eşleşen bildirim bulunamadı.")).toBeInTheDocument();
  });
  it("assigns an available staff member once and switches unit teams", () => {
    render(<Units />);
    fireEvent.click(screen.getByRole("button", { name: "Demo Personel 03 için iş ata" }));
    fireEvent.change(screen.getByLabelText("Atanacak iş"), { target: { value: "2050" } });
    fireEvent.click(screen.getByRole("button", { name: "Atamayı onayla" }));
    const row = screen.getByRole("article", { name: "Demo Personel 03" });
    expect(within(row).getByText("Sahada")).toBeInTheDocument();
    expect(within(row).getByText("Açık otopark aydınlatması")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /iş ata/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bilgi İşlem ekibini göster" }));
    expect(screen.getByRole("heading", { name: "Bilgi İşlem ekibi" })).toBeInTheDocument();
  });
  it("generates an explicit local AI draft and publishes a demo response with status", () => {
    render(<CampusVoice />);
    expect(screen.getByRole("button", { name: "Yanıtı demoda yayınla" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Demo AI taslağı öner" }));
    expect((screen.getByLabelText("Yanıt") as HTMLTextAreaElement).value).toContain("Önerinizi");
    expect(screen.getByText(/Gerçek yapay zeka çağrısı yapılmadı/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Öneri durumu"), { target: { value: "Planlandı" } });
    fireEvent.click(screen.getByRole("button", { name: "Yanıtı demoda yayınla" }));
    expect(screen.getByRole("status")).toHaveTextContent("yalnızca bu ekrana eklendi");
    expect(screen.getByRole("status")).toHaveTextContent("Gerçek bildirim gönderilmedi");
    fireEvent.click(screen.getByRole("button", { name: "Planlandı" }));
    expect(screen.getByRole("button", { name: /Yemekhanede her gün/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Öneri durumu")).toHaveValue("Planlandı");
  });
  it("sorts all suggestions by their creation date rather than their ID", () => {
    render(<CampusVoice />);
    fireEvent.click(screen.getByRole("button", { name: "Hepsi" }));
    fireEvent.change(screen.getByLabelText("Öneri sıralaması"), { target: { value: "newest" } });
    const list = within(screen.getByRole("region", { name: "Öneri listesi" })).getByRole("list");
    const first = within(list).getAllByRole("listitem")[0];
    expect(first).toHaveTextContent("Ders çalışma alanlarına daha fazla priz eklensin");
    expect(first).toHaveTextContent("26 Eki");
  });
  it("keeps suggestion drafts separate and rejects whitespace", () => {
    render(<CampusVoice />);
    fireEvent.change(screen.getByLabelText("Yanıt"), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Yanıtı demoda yayınla" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Ders çalışma/ }));
    expect(screen.getByLabelText("Yanıt")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Uygulandı" }));
    expect(screen.getByRole("heading", { name: /Yanıt yaz/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Yanıt")).toHaveValue("");
  });
});
