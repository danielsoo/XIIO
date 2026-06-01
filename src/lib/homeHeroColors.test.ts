import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HOME_HERO_THEME,
  deriveCtaColors,
  hexToHsv,
  hsvToHex,
  normalizeHex,
  parseHexColor,
  themeFromHeroHex,
} from "./homeHeroColors.ts";

describe("homeHeroColors", () => {
  it("normalizes 3- and 6-digit hex", () => {
    assert.equal(normalizeHex("1c4574"), "#1C4574");
    assert.equal(normalizeHex("#abc"), "#AABBCC");
    assert.equal(normalizeHex("invalid"), null);
  });

  it("builds theme from hero hex with derived CTA", () => {
    const theme = themeFromHeroHex("#1C4574");
    assert.ok(theme);
    assert.equal(theme.heroHex, DEFAULT_HOME_HERO_THEME.heroHex);
    assert.match(theme.ctaHex, /^#[0-9A-F]{6}$/);
    assert.notEqual(theme.ctaHex, theme.heroHex);
  });

  it("round-trips HSV", () => {
    const hsv = hexToHsv("#256195");
    assert.ok(hsv);
    assert.equal(hsvToHex(hsv).toUpperCase(), "#256195");
  });

  it("deriveCtaColors brightens hero", () => {
    const { ctaHex } = deriveCtaColors("#1C4574");
    const hero = parseHexColor("#1C4574")!;
    const cta = parseHexColor(ctaHex)!;
    const heroLum = hero[0] + hero[1] + hero[2];
    const ctaLum = cta[0] + cta[1] + cta[2];
    assert.ok(ctaLum > heroLum);
  });
});
