import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiRequestError } from "@/lib/ai";
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

const attach = vi.fn();
vi.mock("@/lib/submit", () => ({ attachReportPhoto: (...args: unknown[]) => attach(...args) }));

const verify = vi.fn();
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  verifyResolution: (...args: unknown[]) => verify(...args),
}));
vi.mock("@/lib/image", () => ({ prepareImage: async (f: File) => f }));
const upload = vi.fn();
vi.mock("@/lib/upload", () => ({ uploadReportImage: (...args: unknown[]) => upload(...args) }));

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

function viewElement(jobs: StaffJob[]) {
  return (
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
    />
  );
}

function renderView(jobs: StaffJob[]) {
  return render(viewElement(jobs));
}

describe("StaffJobsView", () => {
  beforeEach(() => {
    refresh.mockReset();
    update.mockReset().mockResolvedValue({ error: null });
    insert.mockReset().mockResolvedValue({ error: null });
    rpc.mockReset().mockResolvedValue({ data: true, error: null });
    attach.mockReset().mockResolvedValue(1);
    verify.mockReset();
    upload.mockReset().mockResolvedValue("staff/after.jpg");
  });

  it("moves a job forward and records the status event", async () => {
    renderView([job({})]);
    fireEvent.click(screen.getByRole("button", { name: "Yola çık" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith("staff_update_report_status", {
      rid: 1, expected_status: "yonlendirildi", to_status: "atandi", work_note: null, ai_verdict: null, solution_path: null,
    });
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
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
    expect(attach).toHaveBeenCalledWith(expect.anything(), 1, "staff/after.jpg", "sonra");
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
    expect(rpc).toHaveBeenCalledWith("staff_update_report_status", expect.objectContaining({
      to_status: "cozuldu", work_note: "Tüp değişti", ai_verdict: null,
    }));
  });

  it("only sends a verdict for the exact persisted solution path, including refreshed props", async () => {
    const result = { resolved: true, confidence: 0.91, note: "Verified", ai_pending: false };
    verify.mockResolvedValue(result);
    const current = job({ status: "islemde", afterPath: "staff/old.jpg", afterUrl: "https://x/old.jpg" });
    const { rerender } = renderView([current]);
    fireEvent.change(screen.getByLabelText(/Çözüm fotoğrafı yükle/), { target: { files: [new File(["x"], "after.jpg", { type: "image/jpeg" })] } });
    await screen.findByText(/Verified/);
    fireEvent.click(screen.getByRole("button", { name: "İşi tamamla" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("staff_update_report_status", expect.objectContaining({ ai_verdict: result, solution_path: "staff/after.jpg" })));
    await waitFor(() => expect(screen.getByRole("button", { name: "İşi tamamla" })).toBeEnabled());
    rerender(viewElement([{ ...current, afterPath: "staff/after.jpg" }]));
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
    rerender(viewElement([{ ...current, afterPath: "staff/other.jpg" }]));
    expect(screen.queryByText(/Verified/)).not.toBeInTheDocument();
    rpc.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "İşi tamamla" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("staff_update_report_status", expect.objectContaining({ ai_verdict: null, solution_path: "staff/other.jpg" })));
  });

  it.each([{ data: false, error: null }, { data: null, error: { message: "event failed" } }])("rejects stale or failed atomic status writes: %j", async (result) => {
    rpc.mockResolvedValue(result);
    renderView([job({})]);
    fireEvent.click(screen.getByRole("button", { name: "Yola çık" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Durum güncellenemedi");
    expect(refresh).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([new Error("verify failed"), new AiRequestError(403)])("drops a previous verdict and refreshes persisted replacement media when verification fails: %s", async (failure) => {
    upload.mockResolvedValueOnce("staff/first.jpg").mockResolvedValueOnce("staff/replacement.jpg");
    verify.mockResolvedValueOnce({ resolved: true, confidence: 0.91, note: "İlk fotoğraf", ai_pending: false });
    verify.mockRejectedValueOnce(failure);
    renderView([job({ status: "islemde", afterUrl: "https://x/old.jpg" })]);
    const file = new File(["x"], "after.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText(/Çözüm fotoğrafı yükle/), { target: { files: [file] } });
    await screen.findByText(/İlk fotoğraf/);
    await waitFor(() => expect(screen.getByLabelText(/Çözüm fotoğrafı yükle/)).toBeEnabled());
    refresh.mockClear();
    fireEvent.change(screen.getByLabelText(/Çözüm fotoğrafı yükle/), { target: { files: [file] } });
    await screen.findByRole("alert");
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByText(/İlk fotoğraf/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "İşi tamamla" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("staff_update_report_status", expect.objectContaining({ ai_verdict: null, solution_path: "staff/replacement.jpg" })));
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
