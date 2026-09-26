import { type InitContext, NfNotFound, NfNotInitializedException } from "@nanoforge-dev/common";
import { beforeEach, describe, expect, it } from "vitest";

import { AssetLibrary } from "../src";

const TEST_FILES = new Map([
  ["/test.png", "blob:http://localhost:3000/test.png"],
  ["/test.wasm", "blob:http://localhost:3000/test.wasm"],
  ["/test.wgsl", "blob:http://localhost:3000/test.wgsl"],
]);

const makeInitContext = (files: Map<string, string>): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env: {},
  files,
});

describe("AssetLibrary", () => {
  describe("metadata", () => {
    it("should expose the reserved 'assets' key", () => {
      expect(new AssetLibrary().key).toBe("assets");
    });
  });

  describe("before initialization", () => {
    it("should throw NfNotInitializedException when getAsset is called before __init", () => {
      const library = new AssetLibrary();
      expect(() => library.getAsset("test.png")).toThrow(NfNotInitializedException);
    });
  });

  describe("getAsset", () => {
    let library: AssetLibrary;

    beforeEach(async () => {
      library = new AssetLibrary();
      await library.__init(makeInitContext(TEST_FILES));
    });

    it("should return the correct path for a registered asset", () => {
      expect(library.getAsset("test.png").path).toBe("blob:http://localhost:3000/test.png");
    });

    it("should normalize a path with a leading slash", () => {
      expect(library.getAsset("/test.png").path).toBe("blob:http://localhost:3000/test.png");
    });

    it("should normalize a path with multiple leading slashes", () => {
      expect(library.getAsset("//test.png").path).toBe("blob:http://localhost:3000/test.png");
    });

    it("should normalize a path with a trailing slash", () => {
      expect(library.getAsset("test.wasm/").path).toBe("blob:http://localhost:3000/test.wasm");
    });

    it("should throw NfNotFound for an unknown asset", () => {
      expect(() => library.getAsset("unknown.png")).toThrow(NfNotFound);
    });

    it("should return undefined for an empty or undefined path", () => {
      expect(library.getAsset(undefined)).toBeUndefined();
      expect(library.getAsset("")).toBeUndefined();
    });
  });

  describe("expose", () => {
    it("should return a narrow object whose getAsset matches the instance method", async () => {
      const library = new AssetLibrary();
      await library.__init(makeInitContext(TEST_FILES));

      const exposed = library.expose();
      expect(exposed.getAsset("test.png").path).toBe("blob:http://localhost:3000/test.png");
      expect(Object.keys(exposed)).toEqual(["getAsset"]);
    });
  });
});
