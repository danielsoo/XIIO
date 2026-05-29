import { describe, expect, it } from "vitest";
import { uploadPercentForPhase, uploadPercentForSubmitPhase } from "./upload-progress";

describe("uploadPercentForPhase", () => {
  it("returns staging segment ends", () => {
    expect(uploadPercentForPhase("creating")).toBe(5);
    expect(uploadPercentForPhase("thumbnail")).toBe(10);
    expect(uploadPercentForPhase("finalizing")).toBe(40);
  });

  it("interpolates full and promo staging by byte ratio", () => {
    expect(uploadPercentForPhase("full", 0)).toBe(10);
    expect(uploadPercentForPhase("full", 1)).toBe(22);
    expect(uploadPercentForPhase("promo", 1)).toBe(35);
  });
});

describe("uploadPercentForSubmitPhase", () => {
  it("maps stream phases to 40–100", () => {
    expect(uploadPercentForSubmitPhase("full_upload", 0)).toBe(40);
    expect(uploadPercentForSubmitPhase("full_upload", 1)).toBe(65);
    expect(uploadPercentForSubmitPhase("promo_upload", 1)).toBe(85);
    expect(uploadPercentForSubmitPhase("encoding", 1)).toBe(100);
  });
});
