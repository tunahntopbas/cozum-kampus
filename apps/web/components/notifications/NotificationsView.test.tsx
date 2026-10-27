import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification } from "./NotificationsView";

const update = vi.fn();
const upsert = vi.fn();
const refresh = vi.fn();
const router = { refresh };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
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
    refresh.mockReset();
    update.mockReset().mockResolvedValue({ error: null });
    upsert.mockReset().mockResolvedValue({ error: null });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reconciles arrivals, updated content, remote reads and removals from refreshed props", () => {
    const mounted = render(<NotificationsView userId="u1" notifications={items} prefTypes={{}} />);
    const incoming = { ...items[1], id: 3, title: "Yeni yönetim yanıtı", readAt: null };
    mounted.rerender(<NotificationsView userId="u1" notifications={[
      incoming, { ...items[0], body: "Onarım tamamlandı", readAt: now },
    ]} prefTypes={{}} />);
    expect(screen.getByText("Yeni yönetim yanıtı")).toBeInTheDocument();
    expect(screen.getByText("Onarım tamamlandı")).toBeInTheDocument();
    expect(screen.queryByText("Önerine yanıt geldi")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Okunmamış" }));
    expect(screen.queryByText("Bildirimine teknisyen atandı")).not.toBeInTheDocument();
    expect(screen.getByText("1 okunmamış")).toBeInTheDocument();
  });

  it("preserves an in-flight and completed mark-all action across stale refreshes", async () => {
    let finish!: (result: { error: null }) => void;
    update.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const mounted = render(<NotificationsView userId="u1" notifications={items} prefTypes={{}} />);
    fireEvent.click(screen.getByRole("tab", { name: "Okunmamış" }));
    fireEvent.click(screen.getByRole("button", { name: "Tümünü okundu işaretle" }));
    const incoming = { ...items[1], id: 3, title: "Yeni yönetim yanıtı", readAt: null };
    mounted.rerender(<NotificationsView userId="u1" notifications={[incoming, ...items]} prefTypes={{}} />);
    expect(screen.getByText("1 okunmamış")).toBeInTheDocument();
    expect(screen.queryByText(items[0].title)).not.toBeInTheDocument();
    await act(async () => finish({ error: null }));
    mounted.rerender(<NotificationsView userId="u1" notifications={[incoming, ...items]} prefTypes={{}} />);
    expect(screen.getByText("1 okunmamış")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Okunmamış" })).toHaveAttribute("aria-selected", "true");
  });

  it("restores an unread notification when saving its read action fails", async () => {
    update.mockResolvedValue({ error: { message: "offline" } });
    render(<NotificationsView userId="u1" notifications={items} prefTypes={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /teknisyen atandı bildirimini okundu/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("1 okunmamış")).toBeInTheDocument();
  });

  it("refreshes visible notifications and cleans up polling and return listeners", () => {
    vi.useFakeTimers();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const mounted = render(<NotificationsView userId="u1" notifications={[]} prefTypes={{}} />);
    refresh.mockImplementation(() => mounted.rerender(<NotificationsView userId="u1" notifications={items} prefTypes={{}} />));
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByText("Önerine yanıt geldi")).toBeInTheDocument();
    refresh.mockClear();
    visibility.mockReturnValue("hidden");
    act(() => vi.advanceTimersByTime(60_000));
    expect(refresh).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(2);
    mounted.unmount();
    refresh.mockClear();
    act(() => vi.advanceTimersByTime(60_000));
    fireEvent(document, new Event("visibilitychange"));
    fireEvent(window, new Event("focus"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("filters, links and marks as read", async () => {
    render(<NotificationsView userId="u1" notifications={items} prefTypes={{ muted_reports: [4] }} />);
    expect(screen.getByText("1 okunmamış")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Yanıtı oku" })).toHaveAttribute("href", "/oneriler#oneri-6");
    expect(screen.getByRole("link", { name: "Bildirimi aç" })).toHaveAttribute("href", "/bildirimlerim?yeni=3");
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

  it.each(["returned", "rejected"])("rolls back a %s preference failure and unlocks the switch", async (failure) => {
    if (failure === "rejected") upsert.mockRejectedValue(new Error("offline"));
    else upsert.mockResolvedValue({ error: { message: "offline" } });
    render(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: true }} />);
    const toggle = screen.getByRole("switch", { name: "Durum değişimleri" });
    fireEvent.click(toggle);
    expect(toggle).toBeDisabled();
    await waitFor(() => expect(screen.getByText("Tercih kaydedilemedi.", { exact: true })).toBeInTheDocument());
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toBeEnabled();
  });

  it("reconciles server preferences while protecting and serializing a pending change", async () => {
    const mounted = render(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: true }} />);
    const toggle = screen.getByRole("switch", { name: "Durum değişimleri" });
    mounted.rerender(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: false }} />);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    let finish!: (result: { error: null }) => void;
    upsert.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(toggle).toBeDisabled();
    mounted.rerender(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: false }} />);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await act(async () => finish({ error: null }));
    mounted.rerender(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: false }} />);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    mounted.rerender(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: true }} />);
    mounted.rerender(<NotificationsView userId="u1" notifications={[]} prefTypes={{ durum: false }} />);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});
