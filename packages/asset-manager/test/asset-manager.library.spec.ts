import {
  ApplicationContext,
  type IConfigRegistry,
  InitContext,
  LibraryManager,
} from "@nanoforge/common";

import { AssetManagerLibrary } from "../src";

describe("Asset Manager Library", () => {
  const library = new AssetManagerLibrary();
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
  library.__init(context);

  it("Should get asset", async () => {
    expect((await library.getAsset("test.png")).path).toEqual(
      "blob:http://localhost:3000/test.png",
    );
  });

  it("Should throw on unknown asset", async () => {
    await expect(library.getAsset("test-unknown.png")).rejects.toThrow();
  });

  it("Should get wasm", async () => {
    expect((await library.getWasm("test.wasm")).path).toEqual(
      "blob:http://localhost:3000/test.wasm",
    );
  });

  it("Should throw on unknown wasm", async () => {
    await expect(library.getWasm("test-unknown.wasm")).rejects.toThrow();
  });

  it("Should get wgsl", async () => {
    expect((await library.getWgsl("test.wgsl")).path).toEqual(
      "blob:http://localhost:3000/test.wgsl",
    );
  });

  it("Should throw on unknown wgsl", async () => {
    await expect(library.getWgsl("test-unknown.wgsl")).rejects.toThrow();
  });
});
