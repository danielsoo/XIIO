import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePromoClipRange } from "./promo-clip.ts";
import { validatePromoVideoDuration } from "./promo-video.ts";

describe("promo video validation (duration)", () => {
  it("returns invalid_duration when duration is zero", () => {
    assert.equal(validatePromoVideoDuration(0), "invalid_duration");
  });

  it("returns null for valid duration", () => {
    assert.equal(validatePromoVideoDuration(10), null);
  });
});

describe("promo source trimming", () => {
  it("accepts a 120 second selection from a five minute source", () => {
    assert.equal(validatePromoClipRange(60, 180, 300), null);
  });

  it("rejects selections longer than 120 seconds", () => {
    assert.equal(validatePromoClipRange(0, 120.1, 300), "clip_too_long");
  });

  it("rejects selections outside the source duration", () => {
    assert.equal(validatePromoClipRange(240, 360, 300), "clip_exceeds_duration");
  });
});
