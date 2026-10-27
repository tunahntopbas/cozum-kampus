import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SuggestionsPage from "@/app/(ogrenci)/oneriler/page";
import NotificationsPage from "@/app/(ogrenci)/bildirimler/page";

describe("student demo screens", () => {
  it("toggles votes and displays public management replies", () => {
    render(<SuggestionsPage />);
    const vote = screen.getByRole("button", { name: /Kütüphane final haftasında.*oy ver/ });
    fireEvent.click(vote);
    expect(vote).toHaveAttribute("aria-pressed", "true");
    expect(vote).toHaveTextContent("413");
    fireEvent.click(vote);
    expect(vote).toHaveTextContent("412");
    expect(screen.getByText(/Final haftasında iki salon pilot/)).toBeInTheDocument();
  });
  it("rejects whitespace and adds a locally created suggestion", () => {
    render(<SuggestionsPage />);
    const input = screen.getByLabelText("Önerin");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi gönder" }));
    expect(screen.getByText("Lütfen önerini yaz.")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Yurt çalışma odaları hafta sonu açık kalsın" } });
    fireEvent.click(screen.getByRole("switch", { name: "Adımı gizle" }));
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi gönder" }));
    expect(screen.getByRole("heading", { name: "Yurt çalışma odaları hafta sonu açık kalsın" })).toBeInTheDocument();
    expect(screen.getByText("Anonim öğrenci · Az önce")).toBeInTheDocument();
  });
  it("filters suggestions by category and public replies", () => {
    render(<SuggestionsPage />);
    const categories = screen.getByRole("group", { name: "Öneri kategorileri" });
    fireEvent.click(within(categories).getByRole("button", { name: "Yemekhane" }));
    expect(screen.getByRole("heading", { name: "Yemekhanede her gün vejetaryen seçenek olsun" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Yanıtlananlar" }));
    expect(screen.getByText("Bu kategoride öneri yok. İlk öneriyi sen yazabilirsin.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Yemekhanede her gün vejetaryen seçenek olsun" })).not.toBeInTheDocument();
  });
  it.each([['Evet, çözüldü', 'Demo: çözümü onayladın. Kayıt kapatıldı.'], ['Hâlâ sorun var', 'Demo: bildirim yeniden açıldı. Birime tekrar iletilecek.']])("handles resolution action %s locally", (action, message) => {
    render(<NotificationsPage />);
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: action })).not.toBeInTheDocument();
  });
  it("marks unread notifications read and changes demo preferences", () => {
    render(<NotificationsPage />);
    fireEvent.click(screen.getByRole("switch", { name: "E-posta" }));
    expect(screen.getByRole("switch", { name: "E-posta" })).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("tab", { name: /Okunmamış/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tümünü okundu işaretle" }));
    expect(screen.getByText("Okunmamış bildirim yok.")).toBeInTheDocument();
  });
});

describe("student review regressions", () => {
  it("orders Yeni suggestions by creation date rather than fixture ID", () => {
    render(<SuggestionsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Yeni" }));
    const titles = screen.getAllByRole("article").map(article => within(article).getByRole("heading").textContent);
    expect(titles).toEqual([
      "Yurt çamaşırhanesi 24 saat açık olsun",
      "Ders çalışma alanlarına daha fazla priz eklensin",
      "Yemekhanede her gün vejetaryen seçenek olsun",
      "Kütüphane final haftasında sabaha kadar açık kalsın",
      "Kampüs içi ring seferleri akşam saatlerinde sıklaşsın",
      "Mühendislik Fakültesi önüne kapalı bisiklet park alanı",
    ]);
    fireEvent.change(screen.getByLabelText("Önerin"), { target: { value: "Yeni çalışma alanı açılsın" } });
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi gönder" }));
    expect(within(screen.getAllByRole("article")[0]).getByRole("heading")).toHaveTextContent("Yeni çalışma alanı açılsın");
  });
  it.each([
    [SuggestionsPage, ["Popüler", "Yeni", "Yanıtlananlar"]],
    [NotificationsPage, ["Tümü", "Okunmamış"]],
  ])("connects tabs to panels and supports roving keyboard focus", (Page, names) => {
    render(<Page />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    const assertActive = (index: number) => {
      expect(tabs[index]).toHaveFocus();
      expect(tabs[index]).toHaveAttribute("aria-selected", "true");
      expect(tabs[index]).toHaveAttribute("tabindex", "0");
      const panel = screen.getByRole("tabpanel", { name: names[index] });
      expect(tabs[index]).toHaveAttribute("aria-controls", panel.id);
      expect(panel).toHaveAttribute("aria-labelledby", tabs[index].id);
      tabs.filter((_, other) => other !== index).forEach(tab => expect(tab).toHaveAttribute("tabindex", "-1"));
    };
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    assertActive(1);
    fireEvent.keyDown(tabs[1], { key: "End" });
    assertActive(tabs.length - 1);
    fireEvent.keyDown(tabs[tabs.length - 1], { key: "ArrowRight" });
    assertActive(0);
    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    assertActive(tabs.length - 1);
    fireEvent.keyDown(tabs[tabs.length - 1], { key: "Home" });
    assertActive(0);
  });
});
