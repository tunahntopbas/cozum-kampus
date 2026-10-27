import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNext("/bildir?yer=M1-K2-WC")).toBe("/bildir?yer=M1-K2-WC");
  });

  it("falls back to home for missing values", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
  });
});
