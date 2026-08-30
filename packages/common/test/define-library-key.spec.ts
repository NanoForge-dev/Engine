import { describe, expect, it } from "vitest";

import { defineLibraryKey } from "../src";

describe("defineLibraryKey", () => {
  it("returns the given key unchanged", () => {
    expect(defineLibraryKey("assets")).toBe("assets");
  });
});
