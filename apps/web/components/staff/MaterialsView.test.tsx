import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MaterialRequest, NeededMaterial, StockItem } from "@/lib/staff";

const insert = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => ({ insert: (rows: unknown) => ({ select: () => insert(table, rows) }) }),
  }),
}));

const { MaterialsView } = await import("./MaterialsView");

const stock: StockItem[] = [
  { id: 1, name: "LED tüp 18 W", qty: 12, min: 10 },
  { id: 2, name: "Priz 16 A", qty: 2, min: 6 },
];
const needed: NeededMaterial[] = [
  { name: "LED tüp 18 W", count: 2, itemId: 1, available: 12 },
  { name: "Merdiven", count: 1, itemId: null, available: 0 },
];
const pending: MaterialRequest = { id: 9, itemId: 2, qty: 5, note: null, status: "onay_bekliyor", createdAt: "2026-10-28T08:00:00Z" };

function view(requests: MaterialRequest[] = []) {
  return render(<MaterialsView staffId="u1" stock={stock} needed={needed} activeJobs={3} initialRequests={requests} />);
}

describe("MaterialsView", () => {
  beforeEach(() => insert.mockReset());

  it("shows stock levels, needed materials and requests", () => {
    view([pending]);
    expect(screen.getByText("Kritik")).toBeInTheDocument();
    expect(screen.getByText("Depoda yok")).toBeInTheDocument();
    expect(screen.getByText("Depoda 12")).toBeInTheDocument();
    expect(screen.getByText("Priz 16 A × 5")).toBeInTheDocument();
    expect(screen.getAllByText("Onay bekliyor")).toHaveLength(2);
  });

  it("requests matched missing materials once", async () => {
    insert.mockResolvedValue({
      data: [{ id: 10, item_id: 1, qty: 2, note: "Bugünkü işler için", status: "onay_bekliyor", created_at: "2026-10-28T09:00:00Z" }],
      error: null,
    });
    view();
    fireEvent.click(screen.getByRole("button", { name: "Eksikleri depodan iste" }));
    await screen.findByText("LED tüp 18 W × 2");
    expect(insert).toHaveBeenCalledWith("material_requests", [{ item_id: 1, qty: 2, note: "Bugünkü işler için", requester_id: "u1" }]);
    expect(screen.getByRole("button", { name: "Talepler iletildi" })).toBeDisabled();
  });

  it("validates and sends a new request", async () => {
    insert.mockResolvedValue({ data: null, error: { message: "denied" } });
    view();
    fireEvent.click(screen.getByRole("button", { name: /Yeni talep/ }));
    fireEvent.change(screen.getByLabelText("Miktar"), { target: { value: "0" } });
    fireEvent.submit(screen.getByRole("button", { name: "Talep oluştur" }));
    expect(screen.getByRole("alert")).toHaveTextContent("1–999");
    expect(insert).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Miktar"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Malzeme seç"), { target: { value: "2" } });
    fireEvent.submit(screen.getByRole("button", { name: "Talep oluştur" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("gönderilemedi"));
    expect(insert).toHaveBeenCalledWith("material_requests", [{ item_id: 2, qty: 4, note: null, requester_id: "u1" }]);
  });
});
