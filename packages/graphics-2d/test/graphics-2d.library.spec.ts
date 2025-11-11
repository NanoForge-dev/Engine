import { type IConfigRegistry, InitContext } from "@nanoforge/common";
import { EditableApplicationContext } from "@nanoforge/core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "@nanoforge/core/src/common/library/manager/library.manager";

import { Graphics2DLibrary } from "../src/graphics-2d.library";

describe("Graphics 2D Library", () => {
  const library = new Graphics2DLibrary();
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  const context = new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files: {
      assets: new Map([["/test.png", "blob:http://localhost:3000/test.png"]]),
      wasm: new Map([["/test.wasm", "blob:http://localhost:3000/test.wasm"]]),
      wgsl: new Map([["/test.wgsl", "blob:http://localhost:3000/test.wgsl"]]),
    },
  });

  it("Should throw if canvas is undefined", async () => {
    await expect(library.__init(context)).rejects.toThrow();
  });
});
