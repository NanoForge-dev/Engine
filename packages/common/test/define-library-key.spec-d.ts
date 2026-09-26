import { describe, it } from "vitest";

import { defineLibraryKey } from "../src";

describe("defineLibraryKey (type-level)", () => {
  it("accepts keys already present on Context", () => {
    defineLibraryKey("assets");
    defineLibraryKey("app");
    defineLibraryKey("vars");
  });

  it("rejects keys that are not part of Context", () => {
    // @ts-expect-error "unknown-key" is not a member of Context
    defineLibraryKey("unknown-key");
  });
});
