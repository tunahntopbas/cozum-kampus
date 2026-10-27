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

  it.each(["automatic", "pin", "single building"])("collapses and reopens the selected building (%s)", (mode) => {
    if (mode === "single building") {
      render(<CampusMapView userId="me" buildings={buildings} reports={[reports[0]]} unitNames={{}} votedIds={[]} />);
    } else {
      renderView();
      if (mode === "pin") {
        fireEvent.click(screen.getByRole("button", { name: "Mühendislik Fakültesi Dekanlığı harita işareti" }));
      }
    }
    const building = screen.getByRole("button", { expanded: true });
    expect(screen.getByRole("button", { name: /Koridor lambası yanmıyor/, pressed: true })).toBeInTheDocument();
    fireEvent.click(building);
    expect(building).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /Koridor lambası yanmıyor/, pressed: true })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Seçili bildirim" })).toBeInTheDocument();
    fireEvent.click(building);
    expect(building).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Koridor lambası yanmıyor/, pressed: true })).toBeInTheDocument();
  });

  it("updates report details, counts, pins and votes from refreshed props", () => {
    const { rerender } = renderView();
    const fresh = report({ id: 3, title: "Yeni rapor", status: "cozuldu", voteCount: 12 });
    rerender(<CampusMapView userId="me" buildings={buildings} reports={[fresh]} unitNames={{}} votedIds={[3]} />);
    expect(screen.getByRole("heading", { name: "Yeni rapor" })).toBeInTheDocument();
    expect(screen.getByText("12 kişi bildirdi")).toBeInTheDocument();
    expect(screen.getByText("Sakarya Üniversitesi, 0 açık bildirim")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Süleyman Demirel Kütüphanesi harita işareti" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desteğimi geri al" })).toHaveAttribute("aria-pressed", "true");
    rerender(<CampusMapView userId="me" buildings={buildings} reports={[{ ...fresh, status: "islemde", voteCount: 13 }]} unitNames={{}} votedIds={[]} />);
    expect(screen.getByText("13 kişi bildirdi")).toBeInTheDocument();
    expect(screen.getByText("Sakarya Üniversitesi, 1 açık bildirim")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ben de yaşıyorum" })).toHaveAttribute("aria-pressed", "false");
    rerender(<CampusMapView userId="me" buildings={buildings} reports={[]} unitNames={{}} votedIds={[]} />);
    expect(screen.queryByRole("region", { name: "Seçili bildirim" })).not.toBeInTheDocument();
  });

  it.each([false, true])("preserves a local vote change across stale refreshes (initial support: %s)", async (supported) => {
    const rows = [report({ voteCount: 3 })];
    const view = (nextRows: MapReport[], ids: number[]) => (
      <CampusMapView userId="me" buildings={buildings} reports={nextRows} unitNames={{}} votedIds={ids} />
    );
    const { rerender } = render(view(rows, supported ? [1] : []));
    fireEvent.click(screen.getByRole("button", { name: supported ? "Desteğimi geri al" : "Ben de yaşıyorum" }));
    const count = supported ? 2 : 4;
    await screen.findByText(`${count} kişi bildirdi`);
    rerender(view([report({ title: "Güncel başlık", voteCount: 7 })], supported ? [1] : []));
    expect(screen.getByRole("heading", { name: "Güncel başlık" })).toBeInTheDocument();
    expect(screen.getByText(`${supported ? 6 : 8} kişi bildirdi`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: supported ? "Ben de yaşıyorum" : "Desteğimi geri al" })).toHaveAttribute("aria-pressed", String(!supported));
    // Acknowledgement retires the local override and must not double-count it.
    rerender(view([report({ voteCount: count })], supported ? [] : [1]));
    expect(screen.getByText(`${count} kişi bildirdi`)).toBeInTheDocument();
    // Later authoritative changes are no longer masked by an old local vote.
    rerender(view([report({ voteCount: 10 })], supported ? [1] : []));
    expect(screen.getByText("10 kişi bildirdi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: supported ? "Desteğimi geri al" : "Ben de yaşıyorum" })).toBeInTheDocument();
  });

  it("does not double-count a server vote arriving while its save is pending", async () => {
    let finish!: (result: { error: null }) => void;
    insert.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const view = (count: number, ids: number[]) => (
      <CampusMapView userId="me" buildings={buildings} reports={[report({ voteCount: count })]} unitNames={{}} votedIds={ids} />
    );
    const { rerender } = render(view(3, []));
    fireEvent.click(screen.getByRole("button", { name: "Ben de yaşıyorum" }));
    rerender(view(4, [1]));
    finish({ error: null });
    await waitFor(() => expect(screen.getByRole("button", { name: "Desteğimi geri al" })).toBeEnabled());
    expect(screen.getByText("4 kişi bildirdi")).toBeInTheDocument();
    rerender(view(3, []));
    expect(screen.getByRole("button", { name: "Ben de yaşıyorum" })).toBeInTheDocument();
    expect(screen.getByText("3 kişi bildirdi")).toBeInTheDocument();
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
