import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReportAnalysis } from "@/lib/ai";
import { ReportComposer } from "./ReportComposer";

const mocks = vi.hoisted(() => ({ analyze: vi.fn(), submit: vi.fn(), push: vi.fn(), upload: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/ai", async (original) => ({ ...await original<typeof import("@/lib/ai")>(), analyzeReport: mocks.analyze }));
vi.mock("@/lib/image", () => ({ prepareImage: async () => new Blob(["synthetic"]) }));
vi.mock("@/lib/upload", () => ({ uploadReportImage: mocks.upload }));
vi.mock("@/lib/submit", () => ({ submitReport: mocks.submit }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) } }) }));

const approval: ReportAnalysis = {
  title: "Lamba", category: "aydinlatma", urgency: "orta", unit: "yapi_isleri",
  summary: "Lamba yanmıyor", materials: [], is_sensitive: false,
  moderation: { ok: true, reasons: [] }, confidence: 0.9, ai_pending: false,
};
function mount() {
  render(<ReportComposer userId="u-1" buildings={[]} unitIdBySlug={{ yapi_isleri: 1 }}
    qrPlace={{ id: 1, buildingId: 1, floor: 1, buildingName: "M1", name: "Koridor" }} />);
}
function edit(value: string) { fireEvent.change(screen.getByRole("textbox"), { target: { value } }); }
function submit() { fireEvent.submit(screen.getByRole("form", { name: "Bildirim formu" })); }
async function debounce() { await act(async () => { await vi.advanceTimersByTimeAsync(801); }); }
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mocks.submit.mockResolvedValue(42); mocks.upload.mockResolvedValue("u-1/synthetic.jpg"); URL.createObjectURL = () => "blob:synthetic"; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("cannot submit during debounce or after an analysis error", async () => {
  mocks.analyze.mockRejectedValue(new Error("unavailable"));
  mount(); edit("Lamba yanmıyor"); submit();
  expect(mocks.submit).not.toHaveBeenCalled();
  await debounce(); submit();
  expect(mocks.submit).not.toHaveBeenCalled();
});

it("requires new moderation immediately after editing an approved report", async () => {
  mocks.analyze.mockResolvedValue(approval);
  mount(); edit("Lamba yanmıyor"); await debounce();
  edit("küfür içeren yeni metin"); submit();
  expect(mocks.submit).not.toHaveBeenCalled();
});

it("ignores an approval arriving after input was cleared and retyped", async () => {
  let resolve!: (a: ReportAnalysis) => void;
  mocks.analyze.mockImplementationOnce(() => new Promise<ReportAnalysis>((r) => { resolve = r; }));
  mount(); edit("Lamba yanmıyor"); await debounce();
  edit("");
  await act(async () => { resolve(approval); });
  edit("küfür içeren yeni metin"); submit();
  expect(mocks.submit).not.toHaveBeenCalled();
});

it("publishes the current explicitly approved report", async () => {
  mocks.analyze.mockResolvedValue(approval);
  mount(); edit("Lamba yanmıyor"); await debounce();
  await act(async () => { submit(); });
  expect(mocks.submit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ text: "Lamba yanmıyor" }), approval, "u-1", { yapi_isleri: 1 });
  expect(mocks.push).toHaveBeenCalledWith("/bildirimlerim?yeni=42");
});

it("invalidates approval while a new photo uploads and after it is attached", async () => {
  mocks.analyze.mockResolvedValue(approval);
  mount(); edit("Lamba yanmıyor"); await debounce();
  const fileInput = document.querySelector('input[type="file"][multiple]')!;
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [new File(["synthetic"], "synthetic.jpg", { type: "image/jpeg" })] } });
    submit();
  });
  submit();
  expect(mocks.submit).not.toHaveBeenCalled();
});

it("does not let an older approval overwrite a newer denial", async () => {
  let oldResolve!: (a: ReportAnalysis) => void;
  mocks.analyze.mockImplementationOnce(() => new Promise<ReportAnalysis>((r) => { oldResolve = r; }))
    .mockResolvedValueOnce({ ...approval, moderation: { ok: false, reasons: ["küfür"] } });
  mount(); edit("Lamba yanmıyor"); await debounce();
  edit("Lamba yanmıyor amk"); await debounce();
  await act(async () => { oldResolve(approval); });
  submit();
  expect(mocks.submit).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Bildirimi gönder" })).toBeDisabled();
});
