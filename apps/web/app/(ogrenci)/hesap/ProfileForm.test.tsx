import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const eq = vi.fn();
const update = vi.fn(() => ({ eq }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from: () => ({ update }) }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { ProfileForm } from "./ProfileForm";

const PROFILE = {
  id: "u-1",
  fullName: "Demo Öğrenci",
  studentNo: "20210457",
  department: "Bilgisayar Mühendisliği",
  language: "tr",
  email: "ogrenci@demo.cozumkampus.app",
};

describe("ProfileForm", () => {
  beforeEach(() => {
    eq.mockReset();
    update.mockClear();
  });

  it("locks school-provided fields", () => {
    render(<ProfileForm profile={PROFILE} />);
    expect(screen.getByLabelText("Öğrenci numarası")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Bölüm")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Okul e-postası")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Ad soyad")).not.toHaveAttribute("readonly");
  });

  it("saves only the editable fields", async () => {
    eq.mockResolvedValue({ error: null });
    render(<ProfileForm profile={PROFILE} />);
    fireEvent.change(screen.getByLabelText("Ad soyad"), { target: { value: "  Zeynep Kaya " } });
    fireEvent.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(await screen.findByText("Kaydedildi.")).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({ full_name: "Zeynep Kaya", language: "tr" });
    expect(eq).toHaveBeenCalledWith("id", "u-1");
  });

  it("reports a failed save calmly", async () => {
    eq.mockResolvedValue({ error: { message: "boom" } });
    render(<ProfileForm profile={PROFILE} />);
    fireEvent.click(screen.getByRole("button", { name: "Değişiklikleri kaydet" }));
    expect(await screen.findByText("Kaydedilemedi. Biraz sonra yeniden dene.")).toBeInTheDocument();
  });
});
