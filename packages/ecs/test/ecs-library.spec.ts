import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { ApplicationContext, InitContext } from "@nanoforge/common";
import { EditableLibraryManager } from "@nanoforge/core/src/common/library/manager/library.manager";
import { ECSLibrary } from "@nanoforge/ecs/src/ecs-library";

class Position {
  constructor(
    public x: number,
    public y: number,
  ) {
    this.x = x;
    this.y = y;
  }
}

describe("ECSLibrary", () => {
  let ecs: ECSLibrary;
  const assetManager = new AssetManagerLibrary();
  const appContext = new ApplicationContext();
  const libraryManager = new EditableLibraryManager();
  const context = new InitContext(appContext, libraryManager, {
    // @ts-ignore
    canvas: null,
    files: {
      assets: new Map(),
      wasm: new Map([["/libecs.wasm", "./lib/libecs.wasm"]]),
      wgsl: new Map(),
    },
  });
  libraryManager.setAssetManager(assetManager);

  beforeAll(async () => {
    await assetManager.init(context);
  });

  beforeEach(async () => {
    ecs = new ECSLibrary();
    await ecs.init(context);
  });

  test("init and spawn entity", async () => {
    const entity = ecs.createEntity();
    expect(entity).toBeDefined();
    expect(entity.get_id()).toBe(0);
  });

  test("add component to entity", async () => {
    const entity = ecs.createEntity();
    const pos = new Position(1, 2);
    ecs.addComponent(entity, pos);
    const components = ecs.getComponents(Position);
    expect(components.get(entity.get_id())).toStrictEqual(new Position(1, 2));
    expect(components.size()).toBe(1);
  });

  test("clear", async () => {
    await ecs.clear();
  });
});
