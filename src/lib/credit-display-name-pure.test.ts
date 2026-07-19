import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWorkCreditDisplayNamePure } from "./credit-display-name-pure.ts";

describe("resolveWorkCreditDisplayNamePure", () => {
  const profile = {
    displayName: "표시 이름",
    defaultDirectorName: "감독 표기명",
    handle: "filmmaker",
  };

  it("uses defaultDirectorName for director role", () => {
    assert.equal(resolveWorkCreditDisplayNamePure(profile, "director"), "감독 표기명");
  });

  it("falls back to displayName when director name missing", () => {
    assert.equal(
      resolveWorkCreditDisplayNamePure(
        { displayName: "표시 이름", defaultDirectorName: "" },
        "director"
      ),
      "표시 이름"
    );
  });

  it("uses displayName for actor role", () => {
    assert.equal(resolveWorkCreditDisplayNamePure(profile, "actor"), "표시 이름");
  });

  it("uses displayName for crew roles", () => {
    assert.equal(resolveWorkCreditDisplayNamePure(profile, "cinematography"), "표시 이름");
  });

  it("falls back to handle when displayName empty", () => {
    assert.equal(
      resolveWorkCreditDisplayNamePure(
        { displayName: "", defaultDirectorName: null, handle: "crew_one" },
        "sound"
      ),
      "crew_one"
    );
  });

});
