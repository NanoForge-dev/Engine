import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ClearContext, type IConfigRegistry, InitContext } from "@nanoforge-dev/common";
import { EditableApplicationContext } from "@nanoforge-dev/core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "@nanoforge-dev/core/src/common/library/manager/library.manager";
import { ECSLibrary } from "@nanoforge-dev/ecs/src/ecs-library";

import { type Registry } from "../lib";

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
  let registry: Registry;
  const assetManager = new AssetManagerLibrary();
  const libraryManager = new EditableLibraryManager();
  const appContext = new EditableApplicationContext(libraryManager);
  const configRegistry = {} as IConfigRegistry;
  const initContext = new InitContext(appContext, libraryManager, configRegistry, {
    // @ts-ignore
    canvas: null,
    files: new Map([["/libecs.wasm", "./lib/libecs.wasm"]]),
  });

  const clearContext = new ClearContext(appContext, libraryManager);
  libraryManager.setAssetManager(assetManager);

  beforeAll(async () => {
    await assetManager.__init(initContext);
  });

  beforeEach(async () => {
    ecs = new ECSLibrary();
    await ecs.__init(initContext);
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
    await ecs.__clear(clearContext);
  });
});
