import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySourceVideoQuality,
  sourceVideoQualityLabel,
  supportsFutureHighResolutionDelivery,
} from "./source-video-quality.ts";

test("classifies landscape and portrait masters by the shorter edge", () => {
  assert.equal(classifySourceVideoQuality(3840, 2160), "4k");
  assert.equal(classifySourceVideoQuality(2160, 3840), "4k");
  assert.equal(classifySourceVideoQuality(2560, 1440), "2k");
  assert.equal(classifySourceVideoQuality(1920, 1080), "full_hd");
  assert.equal(classifySourceVideoQuality(1280, 720), "hd");
});

test("marks only sources above 1080p for future high-resolution delivery", () => {
  assert.equal(supportsFutureHighResolutionDelivery("4k"), true);
  assert.equal(supportsFutureHighResolutionDelivery("2k"), true);
  assert.equal(supportsFutureHighResolutionDelivery("full_hd"), false);
  assert.equal(sourceVideoQualityLabel("2k"), "1440p");
});
