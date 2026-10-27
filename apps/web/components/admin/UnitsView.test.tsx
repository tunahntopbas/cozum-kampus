import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminData } from "./fixtures";
import type { UnitRequest } from "./UnitsView";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc: (...a: unknown[]) => rpc(...a) }) }));

const { UnitsView } = await import("./UnitsView");

const staff = [
  { id: "s1", name: "Ayşe Teknisyen", unitId: 1 },
  { id: "s2", name: "Mehmet Usta", unitId: 1 },
];
const requests: UnitRequest[] = [
  { id: 7, unitId: 1, item: "Starter", stock: 6, qty: 2, note: null, status: "onay_bekliyor", requester: "Ayşe Teknisyen", createdAt: "2026-10-28T08:00:00Z" },
  { id: 8, unitId: 1, item: "Priz 16 A", stock: 2, qty: 5, note: "Acil", status: "hazirlaniyor", requester: "Mehmet Usta", createdAt: "2026-10-28T09:00:00Z" },
];
const data = {
  ...adminData,
  reports: [...adminData.reports, { ...adminData.reports[0], id: 5, title: "Kapı kolu kırık", status: "yonlendirildi" as const }],
};

function view() {
  return render(<UnitsView data={data} staff={staff} assignments={{ 1: "s1" }} requests={requests} />);
}

describe("UnitsView", () => {
  beforeEach(() => {
    rpc.mockReset();
    refresh.mockReset();
  });

  it("shows unit cards and the team with their current job", () => {
    view();
    expect(screen.getByRole("button", { name: "Yapı İşleri ekibini göster" })).toHaveAttribute("aria-pressed", "true");
    const ayse = screen.getByRole("article", { name: "Ayşe Teknisyen" });
    expect(within(ayse).getByText("Sahada")).toBeInTheDocument();
    expect(within(ayse).getByText(/Koridor lambası yanmıyor/)).toBeInTheDocument();
    expect(within(screen.getByRole("article", { name: "Mehmet Usta" })).getByText("Müsait")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bilgi İşlem ekibini göster" }));
    expect(screen.getByText("Bu birimde kayıtlı personel yok.")).toBeInTheDocument();
  });

  it("assigns an unassigned job through the admin function", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    view();
    fireEvent.click(screen.getByRole("button", { name: "Mehmet Usta için iş ata" }));
    fireEvent.click(screen.getByRole("button", { name: "Atamayı onayla" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(rpc).toHaveBeenCalledWith("admin_update_report", {
      rid: 5,
      to_unit: 1,
      to_urgency: "orta",
      to_status: "atandi",
      to_staff: "s2",
      note: null,
    });
    expect(screen.getByRole("status")).toHaveTextContent("#5 Mehmet Usta atandı.");
  });

  it("handles material requests and blocks ready when stock is short", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    view();
    const starter = screen.getByRole("listitem", { name: "Starter talebi" });
    fireEvent.click(within(starter).getByRole("button", { name: "Hazır" }));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("set_material_request_status", { rid: 7, to_status: "hazir" }));
    const priz = screen.getByRole("listitem", { name: "Priz 16 A talebi" });
    expect(within(priz).getByRole("button", { name: "Hazır" })).toBeDisabled();
    expect(within(priz).queryByRole("button", { name: "Hazırla" })).not.toBeInTheDocument();
  });

  it("keeps the assignment form and selection when the RPC returns false", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    view();
    fireEvent.click(screen.getByRole("button", { name: "Mehmet Usta için iş ata" }));
    fireEvent.change(screen.getByLabelText("Atanacak iş"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Atamayı onayla" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("İşlem yapılamadı"));
    expect(screen.getByRole("form", { name: "İş ataması" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mehmet Usta · İş ata" })).toBeInTheDocument();
    expect(screen.getByLabelText("Atanacak iş")).toHaveValue("5");
    expect(screen.getByRole("button", { name: "Atamayı onayla" })).toBeEnabled();
    expect(screen.getByRole("status")).not.toHaveTextContent("atandı");
    expect(refresh).not.toHaveBeenCalled();
  });

  it.each([
    ["Hazırla", "hazirlaniyor"],
    ["Hazır", "hazir"],
    ["Reddet", "reddedildi"],
  ])("does not report success when %s returns false", async (label, toStatus) => {
    rpc.mockResolvedValue({ data: false, error: null });
    view();
    const request = screen.getByRole("listitem", { name: "Starter talebi" });
    fireEvent.click(within(request).getByRole("button", { name: label }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("İşlem yapılamadı"));
    expect(rpc).toHaveBeenCalledWith("set_material_request_status", { rid: 7, to_status: toStatus });
    expect(within(request).getByText("Onay bekliyor")).toBeInTheDocument();
    expect(within(request).getByRole("button", { name: label })).toBeEnabled();
    expect(screen.getByRole("status")).not.toHaveTextContent(/hazırlanıyor|stoktan düşüldü|reddedildi/);
    expect(refresh).not.toHaveBeenCalled();
  });
});
