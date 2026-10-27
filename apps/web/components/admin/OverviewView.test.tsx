import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NOW, adminData, panelReport } from "./fixtures";

vi.mock("@/components/map/MapCanvas", () => ({
  MapCanvas: ({ groups, onSelect }: { groups: { building: { id: number; name: string }; reports: unknown[] }[]; onSelect: (id: number) => void }) => (
    <div>
      {groups.map((g) => (
        <button key={g.building.id} onClick={() => onSelect(g.building.id)}>
          {g.building.name} {g.reports.length}
        </button>
      ))}
    </div>
  ),
}));

const { OverviewView } = await import("./OverviewView");

describe("OverviewView", () => {
  it("shows KPIs, the urgent alert and unit performance", () => {
    render(<OverviewView data={adminData} now={NOW} />);
    expect(screen.getByLabelText("Açık bildirim sayısı")).toHaveTextContent("2");
    expect(screen.getByRole("heading", { name: "1 acil bildirim açık" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "İncele" })).toHaveAttribute("href", "/yonetim/bildirimler?filtre=Acil");
    expect(screen.getAllByText("%50")).toHaveLength(2);
    expect(screen.getByRole("row", { name: /Yapı İşleri/ })).toHaveTextContent("1");
    expect(screen.getByText(/1 iş yapay zeka çözümü doğrulayamadığı/)).toBeInTheDocument();
  });

  it("filters the map by category and selects a building", () => {
    render(<OverviewView data={adminData} now={NOW} />);
    expect(screen.getByRole("button", { name: "Yemekhane 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aydınlatma" }));
    expect(screen.queryByRole("button", { name: "Yemekhane 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mühendislik Fakültesi 1" }));
    expect(screen.getByRole("link", { name: "Bildirimlere git" })).toHaveAttribute(
      "href",
      "/yonetim/bildirimler?q=M%C3%BChendislik%20Fak%C3%BCltesi",
    );
  });

  it("switches every period using resolved dates while keeping the open backlog", () => {
    const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();
    const data = {
      ...adminData,
      reports: [
        ...adminData.reports.filter((r) => r.status !== "cozuldu"),
        panelReport({ id: 10, status: "cozuldu", createdAt: ago(1), resolvedAt: ago(1 / 24) }),
        panelReport({ id: 11, urgency: "acil", status: "cozuldu", createdAt: ago(6), resolvedAt: ago(2) }),
        panelReport({ id: 12, urgency: "dusuk", status: "cozuldu", createdAt: ago(20), resolvedAt: ago(10) }),
      ],
      unverified: [11, 12],
    };
    render(<OverviewView data={data} now={NOW} />);
    const periods = screen.getByRole("group", { name: "Zaman aralığı" });
    const check = (label: string, average: string, rate: string, unchecked: string) => {
      fireEvent.click(within(periods).getByRole("button", { name: label }));
      expect(within(periods).getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
      expect(within(screen.getByText("Ortalama çözüm süresi").parentElement!).getByText(average)).toBeInTheDocument();
      expect(within(screen.getByText("Süresinde çözülen").parentElement!).getByText(rate)).toBeInTheDocument();
      expect(within(screen.getByText("Doğrulanmadan kapatılan").parentElement!).getByText(unchecked)).toBeInTheDocument();
      expect(screen.getByLabelText("Açık bildirim sayısı")).toHaveTextContent(/^2$/);
      expect(screen.getByRole("status")).toHaveTextContent("2 açık bildirim, 2 bina");
    };
    check("Bugün", "1 gün", "%100", "0");
    check("Bu ay", "5 gün", "%33", "2");
    check("Bu hafta", "2,5 gün", "%50", "1");
  });

  it("filters every offered category, clears the selected building and restores all open pins", () => {
    const data = {
      ...adminData,
      reports: [...adminData.reports, panelReport({ id: 5, category: "internet_ag", buildingId: 11 })],
    };
    render(<OverviewView data={data} now={NOW} />);
    const categories = screen.getByRole("group", { name: "Kategori" });
    fireEvent.click(screen.getByRole("button", { name: "Mühendislik Fakültesi 1" }));
    expect(screen.getByRole("status")).toHaveTextContent("Mühendislik Fakültesi: 1 açık bildirim");
    for (const [label, pin] of [
      ["Aydınlatma", "Mühendislik Fakültesi 1"],
      ["Su ve tesisat", "Yemekhane 1"],
      ["İnternet ve ağ", "Yemekhane 1"],
    ]) {
      fireEvent.click(within(categories).getByRole("button", { name: label }));
      expect(within(categories).getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("region", { name: `${label} kategorisi ısı haritası` })).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("1 açık bildirim, 1 bina");
      expect(screen.queryByRole("link", { name: "Bildirimlere git" })).not.toBeInTheDocument();
      expect(within(screen.getByRole("region", { name: `${label} kategorisi ısı haritası` })).getAllByRole("button")).toHaveLength(1);
      fireEvent.click(screen.getByRole("button", { name: pin }));
      expect(screen.getByRole("link", { name: "Bildirimlere git" })).toHaveAttribute(
        "href", `/yonetim/bildirimler?q=${encodeURIComponent(pin === "Mühendislik Fakültesi 1" ? "Mühendislik Fakültesi" : "Yemekhane")}`,
      );
    }
    fireEvent.click(within(categories).getByRole("button", { name: "Tümü" }));
    expect(screen.getByRole("status")).toHaveTextContent("3 açık bildirim, 2 bina");
    expect(screen.getByRole("button", { name: "Mühendislik Fakültesi 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yemekhane 2" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Bildirimlere git" })).not.toBeInTheDocument();
  });

  it("refreshes KPIs and removes the urgent action and selected building link when reports close", () => {
    const { rerender } = render(<OverviewView data={adminData} now={NOW} />);
    fireEvent.click(screen.getByRole("button", { name: "Yemekhane 1" }));
    expect(screen.getByRole("link", { name: "Bildirimlere git" })).toBeInTheDocument();
    const data = {
      ...adminData,
      reports: adminData.reports.map((r) => ({ ...r, status: "cozuldu" as const, resolvedAt: new Date(NOW).toISOString() })),
    };
    rerender(<OverviewView data={data} now={NOW} />);
    expect(screen.getByLabelText("Açık bildirim sayısı")).toHaveTextContent(/^0$/);
    expect(screen.queryByRole("link", { name: "İncele" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Bildirimlere git" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 açık bildirim, 0 bina");
    expect(within(screen.getByRole("region", { name: "Tümü kategorisi ısı haritası" })).queryByRole("button")).not.toBeInTheDocument();
  });

  // Known source-review bug: the selected label survives after it leaves the top three.
  // This regression is expected to fail until OverviewView reconciles that selection.
  it("falls back to all categories when refreshed data removes the selected category option", () => {
    const { rerender } = render(<OverviewView data={adminData} now={NOW} />);
    fireEvent.click(screen.getByRole("button", { name: "Aydınlatma" }));
    const data = {
      ...adminData,
      reports: [
        panelReport({ id: 1, category: "aydinlatma" }),
        ...["internet_ag", "su_tesisat", "temizlik"].flatMap((category, index) =>
          Array.from({ length: index + 2 }, (_, n) => panelReport({ id: 10 + index * 10 + n, category })),
        ),
      ],
    };
    rerender(<OverviewView data={data} now={NOW} />);
    const categories = screen.getByRole("group", { name: "Kategori" });
    expect(within(categories).queryByRole("button", { name: "Aydınlatma" })).not.toBeInTheDocument();
    expect(within(categories).getByRole("button", { name: "Tümü" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("10 açık bildirim, 1 bina");
  });

});
