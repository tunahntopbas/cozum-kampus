import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  signInWithPassword: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
};
const router = { replace: vi.fn(), refresh: vi.fn() };

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("next=/bildir"),
}));

import { LoginForm } from "./LoginForm";

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Okul e-postası"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Şifre"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Giriş yap" }));
}

describe("LoginForm password sign in", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS", "ogr.sakarya.edu.tr,demo.cozumkampus.app");
    Object.values(auth).forEach((f) => f.mockReset());
    router.replace.mockReset();
  });

  it("signs in and goes to the requested page", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    render(<LoginForm />);
    fill(" personel@demo.cozumkampus.app ", "gizli");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/bildir"));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "personel@demo.cozumkampus.app", password: "gizli" });
  });

  it("rejects non-school e-mails without calling Supabase", () => {
    render(<LoginForm />);
    fill("a@gmail.com", "x");
    expect(screen.getByText("Okul e-posta adresinle giriş yapabilirsin.")).toBeInTheDocument();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("shows a calm message on wrong credentials", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    render(<LoginForm />);
    fill("a@ogr.sakarya.edu.tr", "yanlis");
    expect(await screen.findByText("E-posta ya da şifre hatalı.")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("offers the e-mail code option", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Şifren yok mu? E-postana kod gönderelim" }));
    expect(screen.getByRole("button", { name: "Kod gönder" })).toBeInTheDocument();
  });
});
