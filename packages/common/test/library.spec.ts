import { describe, expect, it } from "vitest";

import { Library, NfNotInitializedException, defineLibraryKey } from "../src";
import type { Context, InitContext } from "../src";

class TestLibrary extends Library {
  readonly key = defineLibraryKey("assets");

  public expose_throwNotInitializedError(): never {
    return this.throwNotInitializedError();
  }
}

describe("Library", () => {
  describe("defaults", () => {
    it("should have empty relationship arrays when no options are given", () => {
      const lib = new TestLibrary();
      expect(lib.relationships.dependencies).toEqual([]);
      expect(lib.relationships.runBefore).toEqual([]);
      expect(lib.relationships.runAfter).toEqual([]);
    });

    it("should default expose() to undefined", () => {
      expect(new TestLibrary().expose()).toBeUndefined();
    });
  });

  describe("options", () => {
    it("should use partial dependencies option", () => {
      const lib = new TestLibrary({ dependencies: ["other"] });
      expect(lib.relationships.dependencies).toEqual(["other"]);
    });

    it("should use partial runBefore option", () => {
      const lib = new TestLibrary({ runBefore: ["other"] });
      expect(lib.relationships.runBefore).toEqual(["other"]);
    });

    it("should use partial runAfter option", () => {
      const lib = new TestLibrary({ runAfter: ["other"] });
      expect(lib.relationships.runAfter).toEqual(["other"]);
    });
  });

  describe("throwNotInitializedError", () => {
    it("should throw NfNotInitializedException", () => {
      const lib = new TestLibrary();
      expect(() => lib.expose_throwNotInitializedError()).toThrow(NfNotInitializedException);
    });

    it("should include the library key in the error message", () => {
      const lib = new TestLibrary();
      expect(() => lib.expose_throwNotInitializedError()).toThrow(/assets/);
    });
  });

  describe("__init, __run and __clear", () => {
    it("__init should resolve without error by default", async () => {
      await expect(new TestLibrary().__init({} as InitContext)).resolves.toBeUndefined();
    });

    it("__run should resolve without error by default", async () => {
      await expect(new TestLibrary().__run({} as Context)).resolves.toBeUndefined();
    });

    it("__clear should resolve without error by default", async () => {
      await expect(new TestLibrary().__clear({} as Context)).resolves.toBeUndefined();
    });
  });
});
