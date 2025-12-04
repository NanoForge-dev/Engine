import { type IConfigRegistry, InitContext } from "@nanoforge-dev/common";
import { describe, expect, it } from "vitest";

import { EditableApplicationContext } from "../../core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "../../core/src/common/library/manager/library.manager";
import { Graphics2DLibrary } from "../src/graphics-2d.library";

describe("Graphics 2D Library", () => {
  const library = new Graphics2DLibrary();
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  const context = new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files: new Map(),
  });

  it("Should throw if canvas is undefined", async () => {
    await expect(library.__init(context)).rejects.toThrow();
  });
});
