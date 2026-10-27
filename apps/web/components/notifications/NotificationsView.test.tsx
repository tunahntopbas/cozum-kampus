import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification } from "./NotificationsView";

const update = vi.fn();
const upsert = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: (patch: unknown) => ({ in: (_: string, ids: number[]) => ({ is: () => update(patch, ids) }) }),
      upsert: (row: unknown) => upsert(row),
    }),
  }),
}));

const { NotificationsView } = await import("./NotificationsView");

const now = new Date().toISOString();
const items: AppNotification[] = [
  { id: 1, type: "durum", title: "Bildirimine teknisyen atandı", body: "Lamba", payload: { report_id: 3 }, readAt: null, createdAt: now },
  { id: 2, type: "oneri_yaniti", title: "Önerine yanıt geldi", body: "Kütüphane", payload: { suggestion_id: 6 }, readAt: now, createdAt: now },
];

describe("NotificationsView", () => {
  beforeEach(() => {
    update.mockReset().mockResolvedValue({ error: null });
    upsert.mockReset().mockResolvedValue({ error: null });
  });

  it("filters, links and marks as read", async () => {
    render(<NotificationsView userId="u1" notifications={items} prefTypes={{ muted_reports: [4] }} />);
    expect(screen.getByText("1 okunmamış")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Yanıtı oku" })).toHaveAttribute("href", "/oneriler#oneri-6");
    fireEvent.click(screen.getByRole("tab", { name: "Okunmamış" }));
    expect(screen.queryByText("Önerine yanıt geldi")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tümünü okundu işaretle" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ read_at: expect.any(String) }), [1]));
    expect(screen.getByText("0 okunmamış")).toBeInTheDocument();
  });

  it("saves the status preference without losing other prefs", async () => {
    render(<NotificationsView userId="u1" notifications={[]} prefTypes={{ muted_reports: [4] }} />);
    expect(screen.getByText("Henüz bildirimin yok.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "Durum değişimleri" }));
    await waitFor(() => expect(upsert).toHaveBeenCalledWith({ user_id: "u1", types: { muted_reports: [4], durum: false } }));
  });
});
