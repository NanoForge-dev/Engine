import { describe, expect, it } from "vitest";

import { InternalVarsState } from "../src/internal/internal-vars-state";

describe("InternalVarsState", () => {
  it("returns undefined for an unset key", () => {
    const vars = new InternalVarsState().asVarsContext();
    expect(vars.get("score")).toBeUndefined();
  });

  it("seeds from the given initial values", () => {
    const vars = new InternalVarsState({ score: 0 }).asVarsContext();
    expect(vars.get("score")).toBe(0);
  });

  it("set() is reflected by later get() calls", () => {
    const vars = new InternalVarsState().asVarsContext();
    vars.set("score", 10);
    expect(vars.get("score")).toBe(10);
  });
});
