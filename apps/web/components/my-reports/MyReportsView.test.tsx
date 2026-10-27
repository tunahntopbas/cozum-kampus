import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MyReportItem } from "./types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const rpc = vi.fn();
const upsert = vi.fn();
const channel = { on: () => channel, subscribe: () => channel };
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: (...args: unknown[]) => rpc(...args),
    from: () => ({ upsert: (...args: unknown[]) => upsert(...args) }),
    channel: () => channel,
    removeChannel: vi.fn(),
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: "token" } } }) },
    realtime: { setAuth: vi.fn() },
  }),
}));

const { MyReportsView } = await import("./MyReportsView");

function item(over: Partial<MyReportItem>): MyReportItem {
  return {
    id: 1,
    title: "Koridor lambası yanmıyor",
    description: "",
    category: "aydinlatma",
    urgency: "orta",
    status: "islemde",
    unitId: 1,
    buildingId: 1,
    floor: 2,
    lat: null,
    lng: null,
    aiSummary: null,
    voteCount: 3,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    reporterId: "me",
    coverUrl: null,
    events: [],
    photos: { once: [], sonra: [], ek: [] },
    ...over,
  };
}

const mine = [
  item({ id: 1 }),
  item({ id: 2, title: "Yemekhane girişinde su birikintisi", status: "cozuldu", resolvedAt: new Date().toISOString() }),
  item({ id: 3, title: "Asansör kapısı kapanmıyor", urgency: "acil", status: "alindi" }),
];
const supported = [item({ id: 9, title: "Kütüphanede Wi-Fi yok", reporterId: "other", status: "alindi" })];

function renderView(over: Partial<Parameters<typeof MyReportsView>[0]> = {}) {
  return render(
    <MyReportsView
      userId="me"
      mine={mine}
      supported={supported}
      buildingNames={{ 1: "Süleyman Demirel Kütüphanesi" }}
      unitNames={{ 1: "Yapı İşleri" }}
      mutedIds={[]}
      prefTypes={{}}
      newId={null}
      {...over}
    />,
  );
}

describe("MyReportsView", () => {
  beforeEach(() => {
    refresh.mockReset();
    rpc.mockReset().mockResolvedValue({ data: true, error: null });
    upsert.mockReset().mockResolvedValue({ error: null });
  });

  it("shows stats and filters own and supported reports", () => {
    renderView();
    expect(screen.getByText("1 tanesi acil")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Çözüldü" }));
    expect(screen.getByRole("button", { name: /Yemekhane girişinde su birikintisi/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Koridor lambası yanmıyor/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Desteklediklerim" }));
    expect(screen.getByText("Bu filtrelere uygun bildirim yok.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tümü" }));
    const detail = screen.getByRole("region", { name: "Seçili bildirim" });
    expect(within(detail).getByRole("heading", { name: "Kütüphanede Wi-Fi yok" })).toBeInTheDocument();
    expect(within(detail).queryByRole("switch")).not.toBeInTheDocument();
    expect(within(detail).queryByRole("button", { name: "Bildirimi geri çek" })).not.toBeInTheDocument();
  });

  it("saves the notification preference per report", async () => {
    renderView({ mutedIds: [3], prefTypes: { digest: true } });
    fireEvent.click(screen.getByRole("switch", { name: "Durum değişince haber ver" }));
    await waitFor(() =>
      expect(upsert).toHaveBeenCalledWith(
        { user_id: "me", types: { digest: true, muted_reports: [3, 1] } },
        { onConflict: "user_id" },
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /Asansör kapısı kapanmıyor/ }));
    expect(screen.getByRole("switch", { name: "Durum değişince haber ver" })).toHaveAttribute("aria-checked", "false");
  });

  it("withdraws an open report after confirmation", async () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Bildirimi geri çek" }));
    fireEvent.click(screen.getByRole("button", { name: "Geri çekmeyi onayla" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith("withdraw_report", { rid: 1 });
  });

  it("explains a failed withdrawal", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Bildirimi geri çek" }));
    fireEvent.click(screen.getByRole("button", { name: "Geri çekmeyi onayla" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Bildirim geri çekilemedi");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("opens the new report after submitting", () => {
    renderView({ newId: 3 });
    expect(screen.getByRole("status")).toHaveTextContent("Bildirimin alındı (#3)");
    const detail = screen.getByRole("region", { name: "Seçili bildirim" });
    expect(within(detail).getByRole("heading", { name: "Asansör kapısı kapanmıyor" })).toBeInTheDocument();
  });

  it("shows real event times on the timeline", () => {
    renderView({
      mine: [
        item({
          id: 5,
          status: "yonlendirildi",
          events: [{ type: "olusturuldu", payload: {}, createdAt: new Date().toISOString() }],
        }),
      ],
    });
    const timeline = screen.getByRole("list", { name: "Durum geçmişi" });
    expect(within(timeline).getByText("Yapı İşleri, Az önce")).toBeInTheDocument();
    expect(within(timeline).getAllByText("Bekleniyor")).toHaveLength(2);
  });
});
