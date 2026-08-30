import type { InitContext } from "@nanoforge-dev/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Graphics2DLibrary } from "../src";

const makeInitContext = (container: HTMLDivElement | null | undefined): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map(),
    container,
  }) as InitContext;

describe("Graphics2DLibrary", () => {
  describe("metadata", () => {
    it("should expose the reserved 'graphics' key", () => {
      expect(new Graphics2DLibrary().key).toBe("graphics");
    });
  });

  describe("before initialization", () => {
    let library: Graphics2DLibrary;

    beforeEach(() => {
      library = new Graphics2DLibrary();
    });

    it("should throw when stage is accessed before __init", () => {
      expect(() => library.stage).toThrow();
    });

    it("should throw when baseLayer is accessed before __init", () => {
      expect(() => library.baseLayer).toThrow();
    });

    it("should throw when __init is called without a container", async () => {
      await expect(library.__init(makeInitContext(null))).rejects.toThrow();
      await expect(library.__init(makeInitContext(undefined))).rejects.toThrow();
    });
  });

  describe("__clear", () => {
    beforeEach(() => {
      vi.stubGlobal("window", {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("does not throw when called before __init", async () => {
      await expect(new Graphics2DLibrary().__clear({} as any)).resolves.toBeUndefined();
    });
  });

  describe("expose", () => {
    it("throws through to the same not-initialized guard as the instance getters", () => {
      const library = new Graphics2DLibrary();
      expect(() => library.expose().stage).toThrow();
      expect(() => library.expose().baseLayer).toThrow();
    });
  });

  describe("editor drag integration", () => {
    const makeShape = () => ({
      draggable: vi.fn(),
      on: vi.fn(),
    });

    const makeEntry = (entityId: string, shapes: Record<string, ReturnType<typeof makeShape>>) => ({
      __RESERVED_entityId: { entityId },
      ...Object.fromEntries(Object.entries(shapes).map(([name, shape]) => [name, { name, shape }])),
    });

    it("does nothing when ctx.editor or ctx.ecs is absent", async () => {
      const library = new Graphics2DLibrary();
      await expect(
        library.__events({ editor: undefined, ecs: undefined } as any),
      ).resolves.toBeUndefined();
    });

    it("makes drawable shapes draggable and emits move-component on drag end, once per component", async () => {
      const library = new Graphics2DLibrary();
      const shape = makeShape();
      const entries = [makeEntry("entity-1", { DrawableCircle2D: shape })];
      const getZipper = vi.fn((components: { name: string }[]) =>
        components.some((c) => c.name === "DrawableCircle2D") ? entries : [],
      );
      const addSystem = vi.fn();
      const emit = vi.fn();

      const ctx = {
        editor: { emit, on: vi.fn() },
        ecs: { registry: { getZipper, addSystem } },
      } as any;

      await library.__events(ctx);
      expect(addSystem).toHaveBeenCalledOnce();

      const system = addSystem.mock.calls[0]![0] as (registry: unknown) => void;
      system({ getZipper });
      expect(shape.draggable).toHaveBeenCalledWith(true);
      expect(shape.on).toHaveBeenCalledWith("dragend", expect.any(Function));

      const dragEndHandler = shape.on.mock.calls[0]![1] as (e: any) => void;
      dragEndHandler({ target: { _lastPos: { x: 1, y: 2 } } });
      expect(emit).toHaveBeenCalledWith("move-component", "entity-1", "DrawableCircle2D", {
        x: 1,
        y: 2,
      });

      // Running the system again for the same entity/component must not re-wire it.
      system({ getZipper });
      expect(shape.draggable).toHaveBeenCalledOnce();
      expect(shape.on).toHaveBeenCalledOnce();
    });

    it("only wires the drag system once across multiple __events calls", async () => {
      const library = new Graphics2DLibrary();
      const addSystem = vi.fn();
      const ctx = {
        editor: { emit: vi.fn(), on: vi.fn() },
        ecs: { registry: { getZipper: vi.fn(() => []), addSystem } },
      } as any;

      await library.__events(ctx);
      await library.__events(ctx);

      expect(addSystem).toHaveBeenCalledOnce();
    });
  });
});
