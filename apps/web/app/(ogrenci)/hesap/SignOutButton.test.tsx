import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const { signOut, router } = vi.hoisted(() => ({ signOut: vi.fn(), router: { replace: vi.fn(), refresh: vi.fn() } }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signOut } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import { SignOutButton } from "./SignOutButton";
beforeEach(() => vi.resetAllMocks());
it("keeps the session screen and allows retry when sign out fails", async () => {
  signOut.mockResolvedValueOnce({ error: { message: "offline" } }).mockResolvedValueOnce({ error: null });
  render(<SignOutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Çıkış yap" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Çıkış yapılamadı");
  expect(router.replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Çıkış yap" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/giris"));
  expect(router.refresh).toHaveBeenCalledOnce();
});
it("handles a rejected network request", async () => {
  signOut.mockRejectedValue(new Error("network"));
  render(<SignOutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Çıkış yap" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(router.replace).not.toHaveBeenCalled();
});
