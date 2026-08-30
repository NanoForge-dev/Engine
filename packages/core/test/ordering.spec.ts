import { Library } from "@nanoforge-dev/common";
import { describe, expect, it } from "vitest";

import { orderByDependencies, orderByRunSequence } from "../src/library-registry/ordering";

class StubLibrary extends Library {
  constructor(
    public readonly key: string,
    options?: ConstructorParameters<typeof Library>[0],
  ) {
    super(options);
  }
}

describe("orderByDependencies", () => {
  it("returns libraries in the same order when no dependencies are declared", () => {
    const a = new StubLibrary("A");
    const b = new StubLibrary("B");
    expect(orderByDependencies([a, b]).map((l) => l.key)).toEqual(["A", "B"]);
  });

  it("puts a dependency before the library that depends on it", () => {
    const b = new StubLibrary("B");
    const a = new StubLibrary("A", { dependencies: ["B"] });
    const result = orderByDependencies([a, b]).map((l) => l.key);
    expect(result.indexOf("B")).toBeLessThan(result.indexOf("A"));
  });

  it("does not duplicate a shared dependency", () => {
    const dep = new StubLibrary("Dep");
    const a = new StubLibrary("A", { dependencies: ["Dep"] });
    const b = new StubLibrary("B", { dependencies: ["Dep"] });
    const result = orderByDependencies([a, b, dep]).map((l) => l.key);
    expect(result.filter((k) => k === "Dep")).toHaveLength(1);
  });

  it("throws on circular dependencies", () => {
    const a = new StubLibrary("A", { dependencies: ["B"] });
    const b = new StubLibrary("B", { dependencies: ["A"] });
    expect(() => orderByDependencies([a, b])).toThrow(/[Cc]ircular/);
  });

  it("throws when a dependency key doesn't exist", () => {
    const a = new StubLibrary("A", { dependencies: ["Missing"] });
    expect(() => orderByDependencies([a])).toThrow(/Missing/);
  });
});

describe("orderByRunSequence", () => {
  it("returns all libraries when no ordering is specified", () => {
    const a = new StubLibrary("A");
    const b = new StubLibrary("B");
    expect(orderByRunSequence([a, b])).toHaveLength(2);
  });

  it("places a library's runBefore entry before it", () => {
    const a = new StubLibrary("A", { runBefore: ["B"] });
    const b = new StubLibrary("B");
    const result = orderByRunSequence([a, b]).map((l) => l.key);
    expect(result.indexOf("B")).toBeLessThan(result.indexOf("A"));
  });

  it("places a library's runAfter entry after it", () => {
    const a = new StubLibrary("A");
    const b = new StubLibrary("B", { runAfter: ["A"] });
    const result = orderByRunSequence([a, b]).map((l) => l.key);
    expect(result.indexOf("B")).toBeLessThan(result.indexOf("A"));
  });

  it("throws on circular run ordering", () => {
    const a = new StubLibrary("A", { runBefore: ["B"] });
    const b = new StubLibrary("B", { runBefore: ["A"] });
    expect(() => orderByRunSequence([a, b])).toThrow(/[Cc]ircular/);
  });

  it("returns an empty array for empty input", () => {
    expect(orderByRunSequence([])).toHaveLength(0);
  });
});
