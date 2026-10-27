import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NOW, adminData } from "./fixtures";

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
});
