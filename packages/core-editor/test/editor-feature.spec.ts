import { type ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { describe, expect, it, vi } from "vitest";

import { type SaveComponent, type SaveEntity } from "../src/common/context/save.type";
import { CoreEditor } from "../src/editor/core-editor";

const getIndex = vi.fn((component) => {
  return Number(component.entityId.slice(-1));
});

const FakeRegistry = vi.fn(
  class {
    addComponent = vi.fn();
    getComponentsConst = vi.fn(() => ({ getIndex }));
    getEntityComponent = vi.fn((entity: number, component) => {
      return (
        {
          2: {
            Position: {
              name: "Position",
              x: 3,
              y: 4,
            },
            Bullets: {
              name: "Bullets",
              number: 4,
              bulletTypes: ["9mm"],
            },
            __RESERVED_ENTITY_ID: {
              entityId: "ent2",
            },
          },
          3: {
            Position: {
              name: "Position",
              x: 7,
              y: 8,
            },
            __RESERVED_ENTITY_ID: {
              entityId: "ent3",
            },
          },
        } as Record<string, Record<string, any>>
      )[entity]?.[component.name];
    });
    entityFromIndex = vi.fn((index) => {
      return index;
    });
  },
);

describe("EditorFeatures", () => {
  describe("askEntitiesHotReload", () => {
    it("should reload entities with new save variables", async () => {
      const components: SaveComponent[] = [
        {
          name: "Position",
          path: "/tmp/pos",
          paramsNames: ["x", "y"],
        },
        {
          name: "Bullets",
          path: "/tmp/pos",
          paramsNames: ["bulletTypes", "number"],
        },
      ];
      const entities: SaveEntity[] = [
        {
          id: "ent2",
          components: {
            Position: {
              x: 1,
              y: 2,
            },
            Bullets: {
              bulletTypes: ["fire", "water", "rocket"],
              number: 1000,
            },
          },
        },
        {
          id: "ent3",
          components: {
            Position: {
              x: 5,
              y: 6,
            },
          },
        },
      ];
      const fakeReg = new FakeRegistry();
      new CoreEditor({ registry: fakeReg } as any as ECSClientLibrary).askEntitiesHotReload(
        components,
        entities,
      );
      expect(fakeReg.getComponentsConst).toHaveBeenCalledWith({ name: "__RESERVED_ENTITY_ID" });
      expect(getIndex).toHaveBeenNthCalledWith(1, {
        entityId: "ent2",
        name: "__RESERVED_ENTITY_ID",
      });
      expect(getIndex).toHaveBeenNthCalledWith(2, {
        entityId: "ent2",
        name: "__RESERVED_ENTITY_ID",
      });
      expect(getIndex).toHaveBeenNthCalledWith(3, {
        entityId: "ent3",
        name: "__RESERVED_ENTITY_ID",
      });
      expect(fakeReg.getEntityComponent).toHaveBeenNthCalledWith(1, 2, { name: "Position" });
      expect(fakeReg.getEntityComponent).toHaveBeenNthCalledWith(2, 2, { name: "Bullets" });
      expect(fakeReg.getEntityComponent).toHaveBeenNthCalledWith(3, 3, { name: "Position" });
      expect(fakeReg.addComponent).toHaveBeenNthCalledWith(1, 2, { name: "Position", x: 1, y: 2 });
      expect(fakeReg.addComponent).toHaveBeenNthCalledWith(2, 2, {
        name: "Bullets",
        bulletTypes: ["fire", "water", "rocket"],
        number: 1000,
      });
      expect(fakeReg.addComponent).toHaveBeenNthCalledWith(3, 3, { name: "Position", x: 5, y: 6 });
    });
  });
});
