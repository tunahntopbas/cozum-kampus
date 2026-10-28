import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const { rpc, signOut, router } = vi.hoisted(() => ({
  rpc: vi.fn(),
  signOut: vi.fn(),
  router: { replace: vi.fn(), refresh: vi.fn() },
}));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ rpc, auth: { signOut } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
import { DeleteAccountButton } from "./DeleteAccountButton";
beforeEach(() => vi.resetAllMocks());
it("asks for confirmation before deleting", async () => {
  rpc.mockResolvedValue({ error: null });
  signOut.mockResolvedValue({ error: null });
  render(<DeleteAccountButton />);
  fireEvent.click(screen.getByRole("button", { name: "Hesabımı ve verilerimi sil" }));
  expect(rpc).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Evet, kalıcı olarak sil" }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/giris"));
  expect(rpc).toHaveBeenCalledWith("delete_my_account");
  expect(signOut).toHaveBeenCalled();
});
it("can be cancelled", () => {
  render(<DeleteAccountButton />);
  fireEvent.click(screen.getByRole("button", { name: "Hesabımı ve verilerimi sil" }));
  fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
  expect(screen.getByRole("button", { name: "Hesabımı ve verilerimi sil" })).toBeInTheDocument();
  expect(rpc).not.toHaveBeenCalled();
});
it("shows the error and stays signed in when deletion fails", async () => {
  rpc.mockResolvedValue({ error: { message: "x" } });
  render(<DeleteAccountButton />);
  fireEvent.click(screen.getByRole("button", { name: "Hesabımı ve verilerimi sil" }));
  fireEvent.click(screen.getByRole("button", { name: "Evet, kalıcı olarak sil" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Hesap silinemedi");
  expect(signOut).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});
