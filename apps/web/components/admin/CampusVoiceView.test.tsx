import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminSuggestion } from "./CampusVoiceView";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: (...a: unknown[]) => rpc(...a),
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: "tok" } } }) },
  }),
}));
const draft = vi.fn();
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  draftReply: (...a: unknown[]) => draft(...a),
}));

const { CampusVoiceView } = await import("./CampusVoiceView");

const suggestions: AdminSuggestion[] = [
  { id: 1, title: "Vejetaryen seçenek", body: "", category: "Yemekhane", votes: 286, status: "yeni", createdAt: "2026-10-18T06:00:00Z", reply: null },
  { id: 2, title: "Ring seferleri", body: "", category: "Ulaşım", votes: 241, status: "degerlendiriliyor", createdAt: "2026-10-09T06:00:00Z", reply: { body: "Bakıyoruz.", createdAt: "2026-10-10T06:00:00Z" } },
  { id: 3, title: "Priz eklensin", body: "Kütüphanede az", category: "Akademik", votes: 97, status: "yeni", createdAt: "2026-10-26T06:00:00Z", reply: null },
];

describe("CampusVoiceView", () => {
  beforeEach(() => {
    rpc.mockReset();
    draft.mockReset();
    refresh.mockReset();
  });

  it("filters and sorts suggestions", () => {
    render(<CampusVoiceView suggestions={suggestions} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Hepsi" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Öneri sıralaması"), { target: { value: "newest" } });
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Priz eklensin");
  });

  it("fills an AI draft and publishes the reply", async () => {
    draft.mockResolvedValue({ reply: "Önerinizi değerlendiriyoruz.", ai_pending: false });
    rpc.mockResolvedValue({ data: 12, error: null });
    render(<CampusVoiceView suggestions={suggestions} />);
    expect(screen.getByRole("button", { name: "Yanıtı yayınla" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Öneri durumu"), { target: { value: "planlandi" } });
    fireEvent.click(screen.getByRole("button", { name: /Yapay zeka taslağı öner/ }));
    await waitFor(() => expect(screen.getByLabelText("Yanıt")).toHaveValue("Önerinizi değerlendiriyoruz."));
    expect(draft).toHaveBeenCalledWith(
      { title: "Vejetaryen seçenek", body: "", category: "Yemekhane", votes: 286, status: "planlandi" },
      "tok",
    );
    fireEvent.click(screen.getByRole("button", { name: "Yanıtı yayınla" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith("publish_suggestion_reply", {
      sid: 1,
      body: "Önerinizi değerlendiriyoruz.",
      to_status: "planlandi",
      notify: true,
    });
    expect(screen.getByRole("status")).toHaveTextContent("12 kişiye bildirim");
  });

  it("explains when the AI cannot draft", async () => {
    draft.mockResolvedValue({ reply: "", ai_pending: true });
    render(<CampusVoiceView suggestions={suggestions} />);
    fireEvent.click(screen.getByRole("button", { name: /Yapay zeka taslağı öner/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("taslak yazamadı");
    expect(screen.getByLabelText("Yanıt")).toHaveValue("");
  });
});
