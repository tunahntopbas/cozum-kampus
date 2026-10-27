import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("exposes its state and reports the toggled value", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Adım birimlere gösterilmesin" />);
    const el = screen.getByRole("switch", { name: "Adım birimlere gösterilmesin" });
    expect(el).toHaveAttribute("aria-checked", "false");
    fireEvent.click(el);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("Switch hideLabel", () => {
  it("keeps the accessible name but hides the visible text", () => {
    render(<Switch checked onChange={() => {}} label="Anonim bildir" hideLabel />);
    const el = screen.getByRole("switch", { name: "Anonim bildir" });
    expect(el).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Anonim bildir")).toHaveClass("sr-only");
  });
});
