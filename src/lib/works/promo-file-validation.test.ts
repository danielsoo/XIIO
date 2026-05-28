import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePromoVideoDuration } from "./promo-video.ts";

describe("promo video validation (duration)", () => {
  it("returns invalid_duration when duration is zero", () => {
    assert.equal(validatePromoVideoDuration(0), "invalid_duration");
  });

  it("returns null for valid duration", () => {
    assert.equal(validatePromoVideoDuration(10), null);
  });
});
