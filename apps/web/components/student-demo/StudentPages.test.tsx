import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MapPage from "@/app/(ogrenci)/page";
import MyReportsPage from "@/app/(ogrenci)/bildirimlerim/page";
import SuggestionsPage from "@/app/(ogrenci)/oneriler/page";
import NotificationsPage from "@/app/(ogrenci)/bildirimler/page";

describe("student demo screens", () => {
  it("filters map results without leaving stale report details", () => {
    render(<MapPage />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bulunamayan" } });
    expect(screen.getByText("Bu filtrelere uygun bildirim yok.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Koridor lambası yanmıyor" })).not.toBeInTheDocument();
  });
  it("selects a campus pin and toggles support exactly once", () => {
    render(<MapPage />);
    fireEvent.click(screen.getByRole("button", { name: "Kütüphane harita işareti" }));
    const detail = screen.getByRole("region", { name: "Seçili bildirim" });
    expect(within(detail).getByRole("heading", { name: "Kütüphane 2. katta internet kesik" })).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: "Ben de yaşıyorum" }));
    expect(within(detail).getByText("9 kişi bildirdi")).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: "Desteğimi geri al" }));
    expect(within(detail).getByText("8 kişi bildirdi")).toBeInTheDocument();
  });
  it("combines map category and status filters with pin visibility", () => {
    render(<MapPage />);
    fireEvent.change(screen.getByRole("combobox", { name: "Kategori" }), { target: { value: "İnternet" } });
    expect(screen.getByRole("button", { name: "Kütüphane harita işareti" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mühendislik Fakültesi harita işareti" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Durum" }), { target: { value: "Çözüldü" } });
    expect(screen.getByText("Bu filtrelere uygun bildirim yok.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kütüphane harita işareti" })).not.toBeInTheDocument();
  });
  it("switches personal report tabs and filters resolved reports", () => {
    render(<MyReportsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Çözüldü" }));
    expect(screen.getByRole("button", { name: /Yemekhane girişinde su birikintisi/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Koridor lambası yanmıyor/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Desteklediklerim/ }));
    expect(screen.getByRole("tab", { name: /Desteklediklerim/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Bu filtrelere uygun bildirim yok.")).toBeInTheDocument();
  });
  it("keeps report notification preferences separate per selection", () => {
    render(<MyReportsPage />);
    fireEvent.click(screen.getByRole("switch", { name: "Durum değişince haber ver" }));
    fireEvent.click(screen.getByRole("button", { name: /Asansör kapısı kapanmıyor/ }));
    expect(screen.getByRole("switch", { name: "Durum değişince haber ver" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: /Koridor lambası yanmıyor/ }));
    expect(screen.getByRole("switch", { name: "Durum değişince haber ver" })).toHaveAttribute("aria-checked", "false");
  });
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
