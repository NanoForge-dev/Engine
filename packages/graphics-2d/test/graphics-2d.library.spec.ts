import { type IConfigRegistry, InitContext } from "@nanoforge-dev/common";
import { beforeEach, describe, expect, it } from "vitest";

import { EditableApplicationContext } from "../../core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "../../core/src/common/library/manager/library.manager";
import { Graphics2DLibrary } from "../src";

const makeContext = (canvas: HTMLCanvasElement | null) => {
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  return new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas,
    files: new Map(),
  });
};

describe("Graphics2DLibrary", () => {
  describe("metadata", () => {
    it("should expose the correct library name", () => {
      expect(new Graphics2DLibrary().__name).toBe("Graphics2DLibrary");
    });
  });

  describe("before initialization", () => {
    let library: Graphics2DLibrary;

    beforeEach(() => {
      library = new Graphics2DLibrary();
    });

    it("should throw when stage is accessed before __init", () => {
      expect(() => library.stage).toThrow();
    });

    it("should throw when layer is accessed before __init", () => {
      expect(() => library.baseLayer).toThrow();
    });

    it("should throw when __init is called with a null canvas", async () => {
      await expect(library.__init(makeContext(null))).rejects.toThrow();
    });
  });
});
