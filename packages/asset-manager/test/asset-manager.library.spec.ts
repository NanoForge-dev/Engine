import { type IConfigRegistry, InitContext } from "@nanoforge-dev/common";

import { EditableApplicationContext } from "../../core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "../../core/src/common/library/manager/library.manager";
import { AssetManagerLibrary } from "../src";

describe("Asset Manager Library", () => {
  const library = new AssetManagerLibrary();
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  const context = new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files: new Map([
      ["/test.png", "blob:http://localhost:3000/test.png"],
      ["/test.wasm", "blob:http://localhost:3000/test.wasm"],
      ["/test.wgsl", "blob:http://localhost:3000/test.wgsl"],
    ]),
  });
  library.__init(context);

  it("Should get asset", () => {
    expect(library.getAsset("test.png").path).toEqual("blob:http://localhost:3000/test.png");
  });

  it("Should throw on unknown asset", () => {
    expect(() => library.getAsset("test-unknown.png")).toThrow();
  });

  it("Should get wasm", () => {
    expect(library.getAsset("test.wasm").path).toEqual("blob:http://localhost:3000/test.wasm");
  });

  it("Should throw on unknown wasm", () => {
    expect(() => library.getAsset("test-unknown.wasm")).toThrow();
  });

  it("Should get wgsl", () => {
    expect(library.getAsset("test.wgsl").path).toEqual("blob:http://localhost:3000/test.wgsl");
  });

  it("Should throw on unknown wgsl", () => {
    expect(() => library.getAsset("test-unknown.wgsl")).toThrow();
  });
});
