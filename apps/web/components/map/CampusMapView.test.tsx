import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BuildingGroup, MapBuilding, MapReport } from "@/lib/campus";

// MapLibre needs WebGL; the canvas is replaced by plain pin buttons so the screen logic can be tested.
vi.mock("./MapCanvas", () => ({
  MapCanvas: ({ groups, onSelect }: { groups: BuildingGroup[]; onSelect: (id: number) => void }) => (
    <div>
      {groups.map((g) => (
        <button key={g.building.id} type="button" onClick={() => onSelect(g.building.id)}>
          {`${g.building.name} harita işareti`}
        </button>
      ))}
    </div>
  ),
}));

const insert = vi.fn();
const remove = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: (row: unknown) => insert(row),
      delete: () => ({ eq: () => ({ eq: () => remove() }) }),
    }),
  }),
}));

const { CampusMapView } = await import("./CampusMapView");

const buildings: MapBuilding[] = [
  { id: 1, name: "Süleyman Demirel Kütüphanesi", floors: 3, lat: 40.7417, lng: 30.3321 },
  { id: 2, name: "Mühendislik Fakültesi Dekanlığı", floors: 4, lat: 40.7425, lng: 30.3306 },
];

function report(over: Partial<MapReport>): MapReport {
  return {
    id: 1,
    title: "Lamba yanmıyor",
    description: "",
    category: "aydinlatma",
    urgency: "orta",
    status: "islemde",
    unitId: 1,
    buildingId: 2,
    floor: 2,
    lat: null,
    lng: null,
    aiSummary: null,
    voteCount: 3,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    reporterId: "other",
    coverUrl: null,
    ...over,
  };
}

const reports = [
  report({ id: 1, title: "Koridor lambası yanmıyor" }),
  report({ id: 2, title: "Okuma salonunda Wi-Fi yok", category: "internet_ag", buildingId: 1, voteCount: 8, status: "alindi" }),
];

function renderView() {
  return render(
    <CampusMapView userId="me" buildings={buildings} reports={reports} unitNames={{ 1: "Yapı İşleri" }} votedIds={[]} />,
  );
}

describe("CampusMapView", () => {
  beforeEach(() => {
    insert.mockReset().mockResolvedValue({ error: null });
    remove.mockReset().mockResolvedValue({ error: null });
  });

  it("filters results without leaving stale report details", () => {
    renderView();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bulunamayan" } });
    expect(screen.getByText("Bu filtrelere uygun bildirim yok.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Seçili bildirim" })).not.toBeInTheDocument();
  });

  it("selects a building pin and toggles support once", async () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Süleyman Demirel Kütüphanesi harita işareti" }));
    const detail = screen.getByRole("region", { name: "Seçili bildirim" });
    expect(within(detail).getByRole("heading", { name: "Okuma salonunda Wi-Fi yok" })).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole("button", { name: "Ben de yaşıyorum" }));
    await waitFor(() => expect(within(detail).getByText("9 kişi bildirdi")).toBeInTheDocument());
    expect(insert).toHaveBeenCalledWith({ report_id: 2, user_id: "me" });
    fireEvent.click(within(detail).getByRole("button", { name: "Desteğimi geri al" }));
    await waitFor(() => expect(within(detail).getByText("8 kişi bildirdi")).toBeInTheDocument());
    expect(remove).toHaveBeenCalledOnce();
  });

  it("keeps the count when saving support fails", async () => {
    insert.mockResolvedValue({ error: { message: "offline" } });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Süleyman Demirel Kütüphanesi harita işareti" }));
    fireEvent.click(screen.getByRole("button", { name: "Ben de yaşıyorum" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Desteğin kaydedilemedi");
    expect(screen.getByText("8 kişi bildirdi")).toBeInTheDocument();
  });

  it("combines category and status filters with pin visibility", () => {
    renderView();
    fireEvent.change(screen.getByRole("combobox", { name: "Kategori" }), { target: { value: "internet_ag" } });
    expect(screen.getByRole("button", { name: "Süleyman Demirel Kütüphanesi harita işareti" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mühendislik Fakültesi Dekanlığı harita işareti" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Durum" }), { target: { value: "cozuldu" } });
    expect(screen.getByText("Bu filtrelere uygun bildirim yok.")).toBeInTheDocument();
  });

  it("starts from the user's existing vote and reverses it", async () => {
    render(
      <CampusMapView userId="me" buildings={buildings} reports={reports} unitNames={{}} votedIds={[2]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Süleyman Demirel Kütüphanesi harita işareti" }));
    const undo = screen.getByRole("button", { name: "Desteğimi geri al" });
    expect(undo).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(undo);
    await waitFor(() => expect(screen.getByText("7 kişi bildirdi")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Ben de yaşıyorum" })).toBeInTheDocument();
  });

  it("hides the support button on the user's own report", () => {
    render(
      <CampusMapView
        userId="me"
        buildings={buildings}
        reports={[report({ reporterId: "me" })]}
        unitNames={{}}
        votedIds={[]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Ben de yaşıyorum" })).not.toBeInTheDocument();
  });
});
