import { type IConfigRegistry, InitContext, NfNotFound } from "@nanoforge-dev/common";
import { beforeEach, describe, expect, it } from "vitest";

import { EditableApplicationContext } from "../../core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "../../core/src/common/library/manager/library.manager";
import { AssetManagerLibrary } from "../src";

const makeContext = (files: Map<string, string>) => {
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  return new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files,
  });
};

const TEST_FILES = new Map([
  ["/test.png", "blob:http://localhost:3000/test.png"],
  ["/test.wasm", "blob:http://localhost:3000/test.wasm"],
  ["/test.wgsl", "blob:http://localhost:3000/test.wgsl"],
]);

describe("AssetManagerLibrary", () => {
  describe("metadata", () => {
    it("should expose the correct library name", () => {
      expect(new AssetManagerLibrary().__name).toBe("AssetManagerLibrary");
    });
  });

  describe("before initialization", () => {
    it("should throw when getAsset is called before __init", () => {
      const library = new AssetManagerLibrary();
      expect(() => library.getAsset("test.png")).toThrow();
    });
  });

  describe("getAsset", () => {
    let library: AssetManagerLibrary;

    beforeEach(async () => {
      library = new AssetManagerLibrary();
      await library.__init(makeContext(TEST_FILES));
    });

    it("should return the correct path for a png asset", () => {
      expect(library.getAsset("test.png").path).toBe("blob:http://localhost:3000/test.png");
    });

    it("should return the correct path for a wasm asset", () => {
      expect(library.getAsset("test.wasm").path).toBe("blob:http://localhost:3000/test.wasm");
    });

    it("should return the correct path for a wgsl asset", () => {
      expect(library.getAsset("test.wgsl").path).toBe("blob:http://localhost:3000/test.wgsl");
    });

    it("should normalize path with a leading slash", () => {
      expect(library.getAsset("/test.png").path).toBe("blob:http://localhost:3000/test.png");
    });

    it("should normalize path with multiple leading slashes", () => {
      expect(library.getAsset("//test.png").path).toBe("blob:http://localhost:3000/test.png");
    });

    it("should throw NfNotFound for an unknown asset", () => {
      expect(() => library.getAsset("unknown.png")).toThrow(NfNotFound);
    });

    it("should throw NfNotFound for an unknown wasm", () => {
      expect(() => library.getAsset("unknown.wasm")).toThrow(NfNotFound);
    });

    it("should throw NfNotFound for an unknown wgsl", () => {
      expect(() => library.getAsset("unknown.wgsl")).toThrow(NfNotFound);
    });
  });
});
