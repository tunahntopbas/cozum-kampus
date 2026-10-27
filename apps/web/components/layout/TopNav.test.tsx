import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { TopNav } from "./TopNav";

describe("TopNav", () => {
  it("is a labelled navigation with the design's entries", () => {
    render(<TopNav />);
    const nav = screen.getByRole("navigation", { name: "Ana gezinme" });
    expect(nav).toBeInTheDocument();
    for (const name of ["Harita", "Bildirimlerim", "Öneriler", "Bildir"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Bildirimler" })).toHaveAttribute("href", "/bildirimler");
    expect(screen.getByRole("link", { name: "Profil" })).toHaveAttribute("href", "/hesap");
  });

  it("marks only the current section", () => {
    pathname = "/bildirimlerim";
    render(<TopNav />);
    expect(screen.getByRole("link", { name: "Bildirimlerim" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Harita" })).not.toHaveAttribute("aria-current");
  });

  it("marks the profile icon on the account page", () => {
    pathname = "/hesap";
    render(<TopNav />);
    expect(screen.getByRole("link", { name: "Profil" })).toHaveAttribute("aria-current", "page");
  });
});
