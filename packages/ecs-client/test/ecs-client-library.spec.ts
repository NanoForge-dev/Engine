import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ClearContext, type IConfigRegistry, InitContext } from "@nanoforge-dev/common";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { EditableApplicationContext } from "../../core/src/common/context/contexts/application.editable-context";
import { EditableLibraryManager } from "../../core/src/common/library/manager/library.manager";
import { type Registry } from "../lib/libecs";
import { ECSClientLibrary } from "../src/ecs-client-library";

class Position {
  name: string = "Position";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class Velocity {
  name: string = "Velocity";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

const getRunSystemsParams = (registry: Registry) => ({
  libs: { getComponentSystem: () => ({ registry }) },
});

const assetManager = new AssetManagerLibrary();
const libraryManager = new EditableLibraryManager();
const appContext = new EditableApplicationContext(libraryManager);
const configRegistry = {} as IConfigRegistry;
const initContext = new InitContext(appContext, libraryManager, configRegistry, {
  // @ts-ignore
  canvas: null,
  files: new Map([["/assets/libecs.wasm", "./lib/libecs.wasm"]]),
});
const clearContext = new ClearContext(appContext, libraryManager);
libraryManager.setAssetManager(assetManager);

describe("ECSClientLibrary", () => {
  let ecs: ECSClientLibrary;
  let registry: Registry;

  beforeAll(async () => {
    await assetManager.__init(initContext);
  });

  beforeEach(async () => {
    ecs = new ECSClientLibrary();
    await ecs.__init(initContext);
    registry = ecs.registry;
  });

  describe("metadata", () => {
    it("should expose the correct library name", () => {
      expect(ecs.__name).toBe("ECSLibrary");
    });
  });

  describe("entity management", () => {
    it("should spawn an entity with id 0", () => {
      const entity = registry.spawnEntity();
      expect(entity).toBeDefined();
      expect(entity.getId()).toBe(0);
    });

    it("should assign incrementing ids to spawned entities", () => {
      const e0 = registry.spawnEntity();
      const e1 = registry.spawnEntity();
      const e2 = registry.spawnEntity();
      expect(e0.getId()).toBe(0);
      expect(e1.getId()).toBe(1);
      expect(e2.getId()).toBe(2);
    });

    it("should kill an entity and remove its components", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(1, 2));
      registry.killEntity(entity);
      expect(registry.getComponents(Position).get(entity.getId())).toBeUndefined();
    });

    it("should kill an entity with multiple components", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(1, 2));
      registry.addComponent(entity, new Velocity(3, 4));
      registry.killEntity(entity);
      expect(registry.getComponents(Position).get(entity.getId())).toBeUndefined();
      expect(registry.getComponents(Velocity).get(entity.getId())).toBeUndefined();
    });
  });

  describe("component management", () => {
    it("should add a component to an entity", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(1, 2));
      expect(registry.getComponents(Position).get(entity.getId())).toStrictEqual(
        new Position(1, 2),
      );
    });

    it("should override a component on an entity", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(1, 2));
      registry.addComponent(entity, new Position(9, 9));
      expect(registry.getComponents(Position).get(entity.getId())).toStrictEqual(
        new Position(9, 9),
      );
    });

    it("should add multiple component types to the same entity", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(3, 4));
      registry.addComponent(entity, new Velocity(1, 0));
      expect(registry.getComponents(Position).get(entity.getId())).toStrictEqual(
        new Position(3, 4),
      );
      expect(registry.getComponents(Velocity).get(entity.getId())).toStrictEqual(
        new Velocity(1, 0),
      );
    });

    it("should remove a component from an entity", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(1, 2));
      registry.removeComponent(entity, Position);
      expect(registry.getComponents(Position).get(entity.getId())).toBeUndefined();
    });

    it("should track component count across multiple entities", () => {
      const e0 = registry.spawnEntity();
      const e1 = registry.spawnEntity();
      registry.addComponent(e0, new Position(0, 0));
      registry.addComponent(e1, new Position(1, 1));
      expect(registry.getComponents(Position).size()).toBe(2);
    });
  });

  describe("system management", () => {
    it("should run a registered system once per call", () => {
      let counter = 0;
      registry.addSystem(() => {
        counter += 1;
      });
      registry.runSystems(getRunSystemsParams(registry));
      expect(counter).toBe(1);
    });

    it("should run all registered systems in order", () => {
      const order: number[] = [];
      registry.addSystem(() => order.push(1));
      registry.addSystem(() => order.push(2));
      registry.runSystems(getRunSystemsParams(registry));
      expect(order).toStrictEqual([1, 2]);
    });

    it("should run systems multiple times across multiple calls", () => {
      let counter = 0;
      registry.addSystem(() => {
        counter += 1;
      });
      for (let i = 0; i < 5; i++) {
        registry.runSystems(getRunSystemsParams(registry));
      }
      expect(counter).toBe(5);
    });
  });

  describe("lifecycle", () => {
    it("should clear without error", async () => {
      await expect(ecs.__clear(clearContext)).resolves.not.toThrow();
    });
  });
});
