import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffJob } from "./types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const update = vi.fn();
const insert = vi.fn();
const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      update: (patch: unknown) => ({ eq: (_: string, id: number) => update(table, patch, id) }),
      insert: (row: unknown) => insert(table, row),
    }),
    rpc: (...args: unknown[]) => rpc(...args),
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: "tok" } } }) },
  }),
}));

const verify = vi.fn();
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  verifyResolution: (...args: unknown[]) => verify(...args),
}));
vi.mock("@/lib/image", () => ({ prepareImage: async (f: File) => f }));
vi.mock("@/lib/upload", () => ({ uploadReportImage: async () => "staff/after.jpg" }));

const { StaffJobsView } = await import("./StaffJobsView");

function job(over: Partial<StaffJob>): StaffJob {
  return {
    id: 1,
    title: "Koridor lambası yanmıyor",
    description: "",
    category: "aydinlatma",
    urgency: "orta",
    status: "yonlendirildi",
    unitId: 1,
    buildingId: 1,
    floor: 2,
    lat: null,
    lng: null,
    aiSummary: "Armatür yanmıyor.",
    voteCount: 3,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    reporterId: null,
    coverUrl: null,
    place: "Mühendislik Fakültesi Dekanlığı, 2. kat",
    buildingLat: 40.74,
    buildingLng: 30.33,
    beforePath: "student/before.jpg",
    beforeUrl: null,
    afterUrl: null,
    ...over,
  };
}

function renderView(jobs: StaffJob[]) {
  return render(
    <StaffJobsView
      staffId="staff"
      staffName="Mehmet Aksoy"
      unitName="Yapı İşleri"
      jobs={jobs}
      completedToday={[]}
      units={[
        { id: 1, name: "Yapı İşleri" },
        { id: 2, name: "Temizlik" },
      ]}
      ownUnitId={1}
    />,
  );
}

describe("StaffJobsView", () => {
  beforeEach(() => {
    refresh.mockReset();
    update.mockReset().mockResolvedValue({ error: null });
    insert.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset().mockResolvedValue({ data: true, error: null });
    verify.mockReset();
  });

  it("moves a job forward and records the status event", async () => {
    renderView([job({})]);
    fireEvent.click(screen.getByRole("button", { name: "Yola çık" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith("reports", { status: "atandi" }, 1);
    expect(insert).toHaveBeenCalledWith("report_events", {
      report_id: 1,
      type: "durum",
      actor_id: "staff",
      payload: { to: "atandi" },
    });
  });

  it("needs a solution photo before completing", () => {
    renderView([job({ status: "islemde" })]);
    expect(screen.getByRole("button", { name: "İşi tamamla" })).toBeDisabled();
  });

  it("uploads the solution photo and shows the AI verdict", async () => {
    verify.mockResolvedValue({ resolved: true, confidence: 0.91, note: "Lamba yanıyor.", ai_pending: false });
    renderView([job({ status: "islemde" })]);
    const file = new File(["x"], "after.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Çözüm fotoğrafı yükle/), { target: { files: [file] } });
    expect(await screen.findByText(/Yapay zeka sorunun giderildiğini doğruladı \(%91\)/)).toBeInTheDocument();
    expect(insert).toHaveBeenCalledWith("report_media", { report_id: 1, kind: "sonra", storage_path: "staff/after.jpg" });
    expect(verify).toHaveBeenCalledWith(
      { beforePath: "student/before.jpg", afterPath: "staff/after.jpg", category: "aydinlatma" },
      "tok",
    );
  });

  it("completes with the note and verdict once the photo is in", async () => {
    renderView([job({ status: "islemde", afterUrl: "https://x/after.jpg" })]);
    fireEvent.change(screen.getByLabelText("Yapılan işlem"), { target: { value: "Tüp değişti" } });
    fireEvent.click(screen.getByRole("button", { name: "İşi tamamla" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const [, patch] = update.mock.calls[0];
    expect(patch).toMatchObject({ status: "cozuldu" });
    expect(insert).toHaveBeenCalledWith(
      "report_events",
      expect.objectContaining({ payload: { to: "cozuldu", note: "Tüp değişti", ai: null } }),
    );
  });

  it("hands a job off to another unit with a reason", async () => {
    renderView([job({}), job({ id: 2, title: "Musluk akıyor", urgency: "acil" })]);
    const list = screen.getByRole("list", { name: "Bugünkü işler" });
    fireEvent.click(within(list).getByRole("button", { name: /Koridor lambası/ }));
    fireEvent.click(screen.getByRole("button", { name: "Devret" }));
    fireEvent.change(screen.getByLabelText("Devir nedeni"), { target: { value: "Temizlik işi" } });
    fireEvent.submit(screen.getByLabelText("Devir nedeni").closest("form")!);
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("handoff_report", { rid: 1, to_unit: 2, reason: "Temizlik işi" }));
    expect(await screen.findByText("İş devredildi.")).toBeInTheDocument();
  });

  it("shows an empty state without jobs", () => {
    renderView([]);
    expect(screen.getByText("Biriminde açık iş yok.")).toBeInTheDocument();
  });
});
