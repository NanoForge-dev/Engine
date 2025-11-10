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
    files: new Map(),
  });

  it("Should throw if canvas is undefined", async () => {
    await expect(library.__init(context)).rejects.toThrow();
  });
});
