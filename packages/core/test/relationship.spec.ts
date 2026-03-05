import { type ILibrary, LibraryContext, LibraryHandle } from "@nanoforge-dev/common";
import { describe, expect, it } from "vitest";

import { Library } from "../../common/src/library/libraries/library";
import { Relationship } from "../src/common/library/relationship-functions";

class StubLibrary extends Library {
  private readonly _name: string;

  constructor(name: string, options?: ConstructorParameters<typeof Library>[0]) {
    super(options);
    this._name = name;
  }

  get __name(): string {
    return this._name;
  }
}

const makeHandle = (
  sym: symbol,
  name: string,
  options?: ConstructorParameters<typeof Library>[0],
): LibraryHandle => {
  return new LibraryHandle(
    sym,
    new StubLibrary(name, options) as unknown as ILibrary,
    new LibraryContext(),
  );
};

describe("Relationship.getLibrariesByDependencies", () => {
  it("should return libraries in same order when no dependencies are declared", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleA = makeHandle(symA, "A");
    const handleB = makeHandle(symB, "B");

    const result = Relationship.getLibrariesByDependencies([handleA, handleB]);
    expect(result.map((h) => h.library.__name)).toEqual(["A", "B"]);
  });

  it("should put a dependency before the library that depends on it", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleB = makeHandle(symB, "B");
    const handleA = makeHandle(symA, "A", { dependencies: [symB] });

    const result = Relationship.getLibrariesByDependencies([handleA, handleB]);
    const names = result.map((h) => h.library.__name);
    expect(names.indexOf("B")).toBeLessThan(names.indexOf("A"));
  });

  it("should not duplicate a shared dependency", () => {
    const symDep = Symbol("Dep");
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleDep = makeHandle(symDep, "Dep");
    const handleA = makeHandle(symA, "A", { dependencies: [symDep] });
    const handleB = makeHandle(symB, "B", { dependencies: [symDep] });

    const result = Relationship.getLibrariesByDependencies([handleA, handleB, handleDep]);
    const names = result.map((h) => h.library.__name);
    expect(names.filter((n) => n === "Dep")).toHaveLength(1);
  });

  it("should return libraries in reverse dependency order when reverse=true", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleB = makeHandle(symB, "B");
    const handleA = makeHandle(symA, "A", { dependencies: [symB] });

    const result = Relationship.getLibrariesByDependencies([handleA, handleB], true);
    const names = result.map((h) => h.library.__name);
    expect(names.indexOf("A")).toBeLessThan(names.indexOf("B"));
  });

  it("should throw on circular dependencies", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleA = makeHandle(symA, "A", { dependencies: [symB] });
    const handleB = makeHandle(symB, "B", { dependencies: [symA] });

    expect(() => Relationship.getLibrariesByDependencies([handleA, handleB])).toThrow(
      /[Cc]ircular/,
    );
  });
});

describe("Relationship.getLibrariesByRun", () => {
  it("should return all runner libraries when no ordering is specified", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleA = makeHandle(symA, "A");
    const handleB = makeHandle(symB, "B");

    const result = Relationship.getLibrariesByRun([handleA, handleB]);
    expect(result).toHaveLength(2);
  });

  it("should place a library before another when runBefore is set", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleA = makeHandle(symA, "A", { runBefore: [symB] });
    const handleB = makeHandle(symB, "B");

    const result = Relationship.getLibrariesByRun([handleA, handleB]);
    const names = result.map((h) => h.library.__name);
    expect(names.indexOf("B")).toBeLessThan(names.indexOf("A"));
  });

  it("should place a library after another when runAfter is set", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleA = makeHandle(symA, "A");
    const handleB = makeHandle(symB, "B", { runAfter: [symA] });

    const result = Relationship.getLibrariesByRun([handleA, handleB]);
    const names = result.map((h) => h.library.__name);
    expect(names.indexOf("B")).toBeLessThan(names.indexOf("A"));
  });

  it("should throw on circular run dependencies", () => {
    const symA = Symbol("A");
    const symB = Symbol("B");
    const handleA = makeHandle(symA, "A", { runBefore: [symB] });
    const handleB = makeHandle(symB, "B", { runBefore: [symA] });

    expect(() => Relationship.getLibrariesByRun([handleA, handleB])).toThrow(/[Cc]ircular/);
  });

  it("should return empty array for empty input", () => {
    expect(Relationship.getLibrariesByRun([])).toHaveLength(0);
  });
});
