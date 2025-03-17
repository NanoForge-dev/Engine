import { ApplicationContext, InitContext, LibraryManager } from "@nanoforge/common";

import { AssetManagerLibrary } from "../src";

describe("Asset Manager Library", () => {
  const library = new AssetManagerLibrary();
  const appContext = new ApplicationContext();
  const libraryManager = new LibraryManager();
  const context = new InitContext(appContext, libraryManager, {
    // @ts-ignore
    canvas: null,
    files: {
      assets: new Map([["/test.png", "blob:http://localhost:3000/test.png"]]),
      scripts: new Map([["/test.wasm", "blob:http://localhost:3000/test.wasm"]]),
    },
  });
  library.init(context);

  it("Test get asset", async () => {
    await expect(library.getAsset("test.png")).resolves.toEqual(
      "blob:http://localhost:3000/test.png",
    );
  });

  it("Test get unknown asset", async () => {
    await expect(library.getAsset("test-unknown.png")).rejects.toThrow();
  });

  it("Test get script", async () => {
    await expect(library.getScript("test.wasm")).resolves.toEqual(
      "blob:http://localhost:3000/test.wasm",
    );
  });

  it("Test get unknown script", async () => {
    await expect(library.getScript("test-unknown.wasm")).rejects.toThrow();
  });
});
