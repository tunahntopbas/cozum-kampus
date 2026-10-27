import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentSuggestion } from "./SuggestionsView";

const refresh = vi.fn();
const router = { refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const insert = vi.fn();
const del = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({
      insert: (row: unknown) => insert(table, row),
      delete: () => ({ eq: () => ({ eq: () => del(table) }) }),
    }),
  }),
}));

const { SuggestionsView } = await import("./SuggestionsView");

const base = { body: "", status: "yeni", createdAt: "2026-10-20T09:00:00Z", mine: false, anonymous: true, reply: null };
const suggestions: StudentSuggestion[] = [
  { ...base, id: 1, title: "Yurt çamaşırhanesi 24 saat açık olsun", category: "Yaşam", votes: 64 },
  { ...base, id: 2, title: "Kütüphane final haftasında açık kalsın", category: "Kütüphane", votes: 412, reply: "Planladık." },
];
const scorecard = { avgDays: 1.5, resolved: 3, total: 10, replyRate: 50, units: [{ name: "Temizlik", avgDays: 1.3 }] };

function view() {
  return render(<SuggestionsView userId="u1" suggestions={suggestions} votedIds={[2]} scorecard={scorecard} />);
}

describe("SuggestionsView", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  beforeEach(() => {
    insert.mockReset().mockResolvedValue({ error: null });
    del.mockReset().mockResolvedValue({ error: null });
    refresh.mockReset();
  });

  it("votes and unvotes", async () => {
    view();
    const vote = screen.getByRole("button", { name: /Yurt çamaşırhanesi.*oy ver/ });
    fireEvent.click(vote);
    expect(vote).toHaveTextContent("65");
    await waitFor(() => expect(insert).toHaveBeenCalledWith("suggestion_votes", { suggestion_id: 1, user_id: "u1" }));
    fireEvent.click(screen.getByRole("button", { name: /Kütüphane final.*oy ver/ }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("suggestion_votes"));
  });

  it("shows similar suggestions and publishes a new one", async () => {
    view();
    const box = screen.getByLabelText("Önerin");
    fireEvent.change(box, { target: { value: "Çamaşırhane gece de çalışsın" } });
    expect(screen.getByText(/önerisi 64 oya sahip/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi gönder" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(insert).toHaveBeenCalledWith("suggestions", expect.objectContaining({ author_id: "u1", title: "Çamaşırhane gece de çalışsın", category: "Yaşam" }));
    expect(screen.getByRole("status")).toHaveTextContent("Önerin yayınlandı");
  });

  it("lists answered suggestions and the scorecard", () => {
    view();
    fireEvent.click(screen.getByRole("tab", { name: "Yanıtlananlar" }));
    expect(screen.getByText("Planladık.")).toBeInTheDocument();
    expect(screen.getByText("3 / 10")).toBeInTheDocument();
  });

  it("accepts remote vote changes without changing server totals", () => {
    const mounted = view();
    mounted.rerender(<SuggestionsView userId="u1" suggestions={suggestions.map((r) => ({ ...r, votes: r.id === 1 ? 65 : 411 }))} votedIds={[1]} scorecard={scorecard} />);
    const first = screen.getByRole("button", { name: /Yurt çamaşırhanesi.*oy ver/ });
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveTextContent("65");
    const second = screen.getByRole("button", { name: /Kütüphane final.*oy ver/ });
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveTextContent("411");
  });

  it("preserves local votes until acknowledged, then accepts remote changes", async () => {
    const mounted = view();
    const vote = screen.getByRole("button", { name: /Yurt çamaşırhanesi.*oy ver/ });
    fireEvent.click(vote);
    await waitFor(() => expect(vote).toBeEnabled());
    mounted.rerender(<SuggestionsView userId="u1" suggestions={suggestions} votedIds={[2]} scorecard={scorecard} />);
    expect(vote).toHaveAttribute("aria-pressed", "true");
    expect(vote).toHaveTextContent("65");
    mounted.rerender(<SuggestionsView userId="u1" suggestions={suggestions.map((r) => r.id === 1 ? { ...r, votes: 65 } : r)} votedIds={[1, 2]} scorecard={scorecard} />);
    expect(vote).toHaveTextContent("65");
    mounted.rerender(<SuggestionsView userId="u1" suggestions={suggestions} votedIds={[2]} scorecard={scorecard} />);
    expect(vote).toHaveAttribute("aria-pressed", "false");
    expect(vote).toHaveTextContent("64");
  });

  it("rolls back a rejected vote and allows retry", async () => {
    insert.mockRejectedValueOnce(new Error("offline"));
    view();
    const vote = screen.getByRole("button", { name: /Yurt çamaşırhanesi.*oy ver/ });
    fireEvent.click(vote);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Oy kaydedilemedi"));
    expect(vote).toHaveAttribute("aria-pressed", "false");
    expect(vote).toHaveTextContent("64");
    expect(vote).toBeEnabled();
    fireEvent.click(vote);
    await waitFor(() => expect(vote).toBeEnabled());
    expect(vote).toHaveTextContent("65");
  });

  it("blocks overlapping votes for the same suggestion", async () => {
    let finish!: (result: { error: null }) => void;
    insert.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    view();
    const vote = screen.getByRole("button", { name: /Yurt çamaşırhanesi.*oy ver/ });
    fireEvent.click(vote);
    fireEvent.click(vote);
    expect(vote).toBeDisabled();
    expect(vote).toHaveTextContent("65");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(del).not.toHaveBeenCalled();
    await act(async () => finish({ error: null }));
    expect(vote).toBeEnabled();
  });

  it("restores support after a rejected unvote", async () => {
    del.mockRejectedValueOnce(new Error("offline"));
    view();
    const vote = screen.getByRole("button", { name: /Kütüphane final.*oy ver/ });
    fireEvent.click(vote);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Oy kaydedilemedi"));
    expect(vote).toHaveAttribute("aria-pressed", "true");
    expect(vote).toHaveTextContent("412");
    expect(vote).toBeEnabled();
  });

  it("keeps the draft and unlocks submit after a rejected request", async () => {
    insert.mockRejectedValueOnce(new Error("offline"));
    view();
    fireEvent.change(screen.getByLabelText("Önerin"), { target: { value: "Bahçeye bank eklensin" } });
    fireEvent.click(screen.getByRole("button", { name: "Öneriyi gönder" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Öneri gönderilemedi"));
    expect(screen.getByLabelText("Önerin")).toHaveValue("Bahçeye bank eklensin");
    expect(screen.getByRole("button", { name: "Öneriyi gönder" })).toBeEnabled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("fetches a newly published reply while open without losing the student's draft or tab", () => {
    vi.useFakeTimers();
    const mounted = view();
    fireEvent.change(screen.getByLabelText("Önerin"), { target: { value: "Bahçeye bank eklensin" } });
    fireEvent.click(screen.getByRole("tab", { name: "Yanıtlananlar" }));
    // Model the server response at the router boundary; no student action triggers the refresh.
    refresh.mockImplementation(() => mounted.rerender(
      <SuggestionsView userId="u1" suggestions={suggestions.map((r) => r.id === 1
        ? { ...r, status: "planlandi", reply: "Çalışma saatleri uzatılacak." }
        : r)} votedIds={[2]} scorecard={scorecard} />,
    ));

    act(() => vi.advanceTimersByTime(30_000));

    expect(screen.getByText("Çalışma saatleri uzatılacak.")).toBeInTheDocument();
    expect(screen.getByText("Planlandı")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Yanıtlananlar" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Önerin")).toHaveValue("Bahçeye bank eklensin");
  });

  it("pauses background refreshes and refreshes when the student returns", () => {
    vi.useFakeTimers();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const mounted = view();
    act(() => vi.advanceTimersByTime(60_000));
    expect(refresh).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledTimes(1);
    fireEvent(window, new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(2);
    mounted.unmount();
    refresh.mockClear();
    act(() => vi.advanceTimersByTime(60_000));
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));
    expect(refresh).not.toHaveBeenCalled();
  });
});
