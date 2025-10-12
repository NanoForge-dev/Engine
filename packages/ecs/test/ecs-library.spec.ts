import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import {
  ApplicationContext,
  ClearContext,
  type IConfigRegistry,
  InitContext,
} from "@nanoforge/common";
import { EditableLibraryManager } from "@nanoforge/core/src/common/library/manager/library.manager";
import { type ECSRegistry } from "@nanoforge/ecs";
import { ECSLibrary } from "@nanoforge/ecs/src/ecs-library";

class Position {
  name: string = "Position";
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
  let registry: ECSRegistry;
  const assetManager = new AssetManagerLibrary();
  const appContext = new ApplicationContext();
  const libraryManager = new EditableLibraryManager();
  const configRegistry = {} as IConfigRegistry;
  const initContext = new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files: {
      assets: new Map(),
      wasm: new Map([["/libecs.wasm", "./lib/libecs.wasm"]]),
      wgsl: new Map(),
    },
  });

  const clearContext = new ClearContext(appContext, libraryManager);
  libraryManager.setAssetManager(assetManager);

  beforeAll(async () => {
    await assetManager.init(initContext);
  });

  beforeEach(async () => {
    ecs = new ECSLibrary();
    await ecs.init(initContext);
    registry = ecs.registry;
  });

  test("init and spawn entity", async () => {
    const entity = registry.spawnEntity();
    expect(entity).toBeDefined();
    expect(entity.getId()).toBe(0);
  });

  test("add component to entity", async () => {
    const entity = registry.spawnEntity();
    const pos = new Position(1, 2);
    registry.addComponent(entity, pos);
    const components = registry.getComponents(Position);
    expect(components.get(entity.getId())).toStrictEqual(new Position(1, 2));
    expect(components.size()).toBe(1);
  });

  test("clear", async () => {
    await ecs.clear(clearContext);
  });
});
