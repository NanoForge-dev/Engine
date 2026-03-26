import { type ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type EventEmitter, EventTypeEnum } from "../src/common/context/event-emitter.type";
import type { IEditorRunOptions } from "../src/common/context/options.type";
import { type Save, type SaveComponent, type SaveEntity } from "../src/common/context/save.type";
import { CoreEditor } from "../src/editor/core-editor";

describe("EditorFeatures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("eventEmitter", () => {
    it("should execute eventQueue once", async () => {
      const events: EventEmitter = {
        eventQueue: [EventTypeEnum.HOT_RELOAD, EventTypeEnum.HOT_RELOAD],
      };
      const spyHotReload = vi
        .spyOn(CoreEditor.prototype, "askEntitiesHotReload")
        .mockImplementation(() => {});
      new CoreEditor({ events } as IEditorRunOptions["editor"], {} as ECSClientLibrary).runEvents();
      expect(spyHotReload).toHaveBeenCalledTimes(2);
    });
  });

  describe("askEntitiesHotReload", () => {
    it("should reload entities with new save variables", async () => {
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
      new CoreEditor(
        {
          save: {
            components,
            entities,
          } as any as Save,
        } as any as IEditorRunOptions["editor"],
        { registry: fakeReg } as any as ECSClientLibrary,
      ).askEntitiesHotReload();
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
