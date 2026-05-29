import { describe, expect, it } from "vitest";
import { uploadPercentForPhase } from "./upload-progress";

describe("uploadPercentForPhase", () => {
  it("returns segment ends for discrete phases", () => {
    expect(uploadPercentForPhase("creating")).toBe(5);
    expect(uploadPercentForPhase("thumbnail")).toBe(10);
    expect(uploadPercentForPhase("finalizing")).toBe(100);
  });

  it("interpolates full and promo by byte ratio", () => {
    expect(uploadPercentForPhase("full", 0)).toBe(10);
    expect(uploadPercentForPhase("full", 1)).toBe(55);
    expect(uploadPercentForPhase("promo", 0)).toBe(55);
    expect(uploadPercentForPhase("promo", 1)).toBe(95);
  });
});
