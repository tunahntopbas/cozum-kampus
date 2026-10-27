import { describe, expect, it } from "vitest";
import { fitWithin, isSupportedImageType } from "./image";

describe("fitWithin", () => {
  it("scales landscape images down to the max edge", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  });

  it("scales portrait images down to the max edge", () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  it("never upscales small images", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("rounds to whole pixels", () => {
    expect(fitWithin(4001, 3001)).toEqual({ width: 1600, height: 1200 });
  });
});

describe("isSupportedImageType", () => {
  it("accepts jpeg, png and webp", () => {
    expect(isSupportedImageType("image/jpeg")).toBe(true);
    expect(isSupportedImageType("image/png")).toBe(true);
    expect(isSupportedImageType("image/webp")).toBe(true);
  });

  it("rejects heic and non-images", () => {
    expect(isSupportedImageType("image/heic")).toBe(false);
    expect(isSupportedImageType("application/pdf")).toBe(false);
  });
});
