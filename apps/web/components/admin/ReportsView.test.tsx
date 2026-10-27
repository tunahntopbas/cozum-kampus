import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminData } from "./fixtures";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc: (...a: unknown[]) => rpc(...a) }) }));

const { ReportsView } = await import("./ReportsView");

const staff = [
  { id: "s1", name: "Ayşe Teknisyen", unitId: 1 },
  { id: "s2", name: "Ali Ağ", unitId: 2 },
];
const notes = [{ reportId: 1, body: "Merdiven gerekli", createdAt: "2026-10-28T08:00:00Z", author: "Yönetim" }];

function view(props: Partial<Parameters<typeof ReportsView>[0]> = {}) {
  return render(<ReportsView data={adminData} staff={staff} assignments={{ 1: "s1" }} notes={notes} {...props} />);
}

describe("ReportsView", () => {
  beforeEach(() => {
    rpc.mockReset();
    refresh.mockReset();
  });

  it("filters by quick filter, unit and search", () => {
    view({ initialFilter: "Acil" });
    expect(screen.getByRole("status")).toHaveTextContent("1 bildirim");
    expect(screen.getByRole("heading", { name: "Su sızıntısı" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tümü" }));
    fireEvent.change(screen.getByLabelText("Birim filtresi"), { target: { value: "2" } });
    expect(screen.getByText("Eşleşen bildirim bulunamadı.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Birim filtresi"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Bildirim ara"), { target: { value: "#4" } });
    expect(screen.getByText(/yapay zeka çözüm fotoğrafını doğrulayamadı/)).toBeInTheDocument();
  });

  it("shows the assignment and internal notes, limits technicians to the unit", () => {
    view();
    expect(screen.getByLabelText("Atanan teknisyen")).toHaveValue("s1");
    expect(screen.getByText("Merdiven gerekli")).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Ali Ağ" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sorumlu birim"), { target: { value: "2" } });
    expect(screen.getByLabelText("Atanan teknisyen")).toHaveValue("");
    expect(screen.getByRole("option", { name: "Ali Ağ" })).toBeInTheDocument();
  });

  it("routes an unrouted report and saves through the admin function", async () => {
    rpc.mockResolvedValue({ error: null });
    view({ initialFilter: "Yönlendirilmedi" });
    fireEvent.change(screen.getByLabelText("Sorumlu birim"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Atanan teknisyen"), { target: { value: "s1" } });
    fireEvent.change(screen.getByLabelText("İç not"), { target: { value: " Acil bakılsın " } });
    fireEvent.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith("admin_update_report", {
      rid: 2,
      to_unit: 1,
      to_urgency: "acil",
      to_status: "atandi",
      to_staff: "s1",
      note: "Acil bakılsın",
    });
    expect(screen.getByRole("status")).toHaveTextContent("#2 kaydedildi.");
  });

  it("reports a failed save", async () => {
    rpc.mockResolvedValue({ error: { message: "denied" } });
    view();
    fireEvent.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("kaydedilemedi");
    expect(refresh).not.toHaveBeenCalled();
  });
});
