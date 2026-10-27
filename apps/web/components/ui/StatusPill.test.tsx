import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("renders the Turkish label for the status", () => {
    render(<StatusPill status="cozuldu" />);
    expect(screen.getByText("Çözüldü")).toBeInTheDocument();
  });
});
