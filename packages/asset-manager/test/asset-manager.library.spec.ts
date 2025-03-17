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
      wasm: new Map([["/test.wasm", "blob:http://localhost:3000/test.wasm"]]),
      wgsl: new Map([["/test.wgsl", "blob:http://localhost:3000/test.wgsl"]]),
    },
  });
  library.init(context);

  it("Should get asset", async () => {
    await expect(library.getAsset("test.png")).resolves.toEqual(
      "blob:http://localhost:3000/test.png",
    );
  });

  it("Should throw on unknown asset", async () => {
    await expect(library.getAsset("test-unknown.png")).rejects.toThrow();
  });

  it("Should get wasm", async () => {
    await expect(library.getWasm("test.wasm")).resolves.toEqual(
      "blob:http://localhost:3000/test.wasm",
    );
  });

  it("Should throw on unknown wasm", async () => {
    await expect(library.getWasm("test-unknown.wasm")).rejects.toThrow();
  });

  it("Should get wgsl", async () => {
    await expect(library.getWgsl("test.wgsl")).resolves.toEqual(
      "blob:http://localhost:3000/test.wgsl",
    );
  });

  it("Should throw on unknown wgsl", async () => {
    await expect(library.getWgsl("test-unknown.wgsl")).rejects.toThrow();
  });
});
