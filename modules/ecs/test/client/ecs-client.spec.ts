import type { Context, InitContext } from "@nanoforge-dev/common";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { EcsLibrary } from "../../src/client";
import type { Registry } from "../../src/client";

class Position {
  name = "Position";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class Velocity {
  name = "Velocity";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

const makeInitContext = (): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env: {},
  files: new Map([["/libecs.wasm", "./lib/web/libecs.wasm"]]),
});

const makeContext = (): Context =>
  ({
    app: {} as any,
    vars: { get: () => undefined, set: () => {} },
    assets: {} as any,
  }) as unknown as Context;

describe("EcsLibrary (client)", () => {
  let ecs: EcsLibrary;
  let registry: Registry;

  beforeAll(async () => {
    ecs = new EcsLibrary();
    await ecs.__init(makeInitContext());
    registry = ecs.registry;
  });

  describe("metadata", () => {
    it("should expose the reserved 'ecs' key", () => {
      expect(ecs.key).toBe("ecs");
    });
  });

  describe("before initialization", () => {
    it("should throw when registry is accessed before __init", () => {
      expect(() => new EcsLibrary().registry).toThrow();
    });
  });

  describe("entity management", () => {
    it("should spawn entities with incrementing ids", () => {
      const e0 = registry.spawnEntity();
      const e1 = registry.spawnEntity();
      expect(e1.getId()).toBe(e0.getId() + 1);
    });

    it("should kill an entity and remove its components", () => {
      const entity = registry.spawnEntity();
      registry.addComponent(entity, new Position(1, 2));
      registry.killEntity(entity);
      expect(registry.getComponents(Position).get(entity.getId())).toBeUndefined();
    });
  });

  describe("component management", () => {
    it("should add and override components on an entity", () => {
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
  });

  describe("system management", () => {
    it("should run all registered systems in order on __run", async () => {
      const order: number[] = [];
      registry.clearSystems();
      registry.addSystem(() => order.push(1));
      registry.addSystem(() => order.push(2));

      await ecs.__run(makeContext());

      expect(order).toStrictEqual([1, 2]);
      registry.clearSystems();
    });
  });

  describe("editor hot-reload", () => {
    it("registers a 'hot-reload' listener on the editor bridge once, during __init, and applies it via addComponent", async () => {
      const on = vi.fn();
      const lib = new EcsLibrary();
      await lib.__init({
        ...makeInitContext(),
        editor: {
          toEditor: { emit: vi.fn(), on: vi.fn() },
          fromEditor: { emit: vi.fn(), on },
        } as any,
      });

      expect(on).toHaveBeenCalledTimes(1);
      expect(on).toHaveBeenCalledWith("hot-reload", expect.any(Function));

      const reg = lib.registry;
      const entity = reg.spawnEntity();
      const handler = on.mock.calls[0]?.[1] as (...args: unknown[]) => void;
      handler(entity, new Position(5, 5));
      expect(reg.getComponents(Position).get(entity.getId())).toStrictEqual(new Position(5, 5));

      await lib.__events(makeContext());
      await lib.__run(makeContext());
      expect(on).toHaveBeenCalledTimes(1); // wired once, never per tick
    });
  });

  describe("expose", () => {
    it("should expose the same registry via the context API", () => {
      expect(ecs.expose().registry).toBe(registry);
    });
  });

  describe("lifecycle", () => {
    it("should clear without error", async () => {
      await expect(ecs.__clear(makeContext())).resolves.toBeUndefined();
    });
  });
});
