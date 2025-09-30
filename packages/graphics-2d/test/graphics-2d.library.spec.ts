import {
  ApplicationContext,
  type IConfigRegistry,
  InitContext,
  LibraryManager,
} from "@nanoforge/common";

import { Graphics2DLibrary } from "../src/graphics-2d.library";

describe("Graphics 2D Library", () => {
  const library = new Graphics2DLibrary();
  const appContext = new ApplicationContext();
  const libraryManager = new LibraryManager();
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
    await expect(library.init(context)).rejects.toThrow();
  });
});
