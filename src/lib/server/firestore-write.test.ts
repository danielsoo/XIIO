import { describe, expect, it } from "vitest";
import { omitUndefined } from "./firestore-write";

describe("omitUndefined", () => {
  it("removes undefined keys", () => {
    expect(omitUndefined({ a: 1, b: undefined, c: "x" })).toEqual({ a: 1, c: "x" });
  });

  it("keeps null values", () => {
    expect(omitUndefined({ a: null })).toEqual({ a: null });
  });
});
