import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeObjectContainRect,
  cropToFrameRect,
  frameCenterToCrop,
  maxPortraitFrameInRect,
} from "./promo-crop-interaction-pure.ts";

describe("computeObjectContainRect", () => {
  it("letterboxes landscape video in portrait container", () => {
    const display = computeObjectContainRect({
      containerWidth: 180,
      containerHeight: 320,
      videoWidth: 1920,
      videoHeight: 1080,
    });
    assert.equal(display.width, 180);
    assert.ok(display.height < 320);
    assert.ok(display.top > 0);
  });
});

describe("maxPortraitFrameInRect", () => {
  it("fits 9:16 inside landscape display", () => {
    const frame = maxPortraitFrameInRect(320, 180);
    assert.ok(Math.abs(frame.width / frame.height - 9 / 16) < 0.001);
    assert.ok(frame.height <= 180);
    assert.ok(frame.width <= 320);
  });
});

describe("crop round-trip", () => {
  it("restores focal after cropToFrameRect and frameCenterToCrop", () => {
    const display = { left: 40, top: 10, width: 240, height: 135 };
    const crop = { focalX: 62, focalY: 44, zoom: 1.25 };
    const frame = cropToFrameRect(crop, display);
    const restored = frameCenterToCrop(
      frame.left + frame.width / 2,
      frame.top + frame.height / 2,
      display,
      crop.zoom
    );
    assert.ok(Math.abs(restored.focalX - crop.focalX) < 0.01);
    assert.ok(Math.abs(restored.focalY - crop.focalY) < 0.01);
    assert.equal(restored.zoom, crop.zoom);
  });
});
