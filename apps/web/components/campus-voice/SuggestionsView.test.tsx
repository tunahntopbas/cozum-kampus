import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentSuggestion } from "./SuggestionsView";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
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
});
