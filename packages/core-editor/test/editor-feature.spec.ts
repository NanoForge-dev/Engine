import { type IRunOptions } from "@nanoforge-dev/common";
import { type ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CoreEvents } from "../src/common/context/events/core-events";
import { type Save, type SaveComponent, type SaveEntity } from "../src/common/context/save.type";
import { type Core } from "../src/core/core";
import { CoreEditor } from "../src/editor/core-editor";
import { EventEmitter } from "./helpers/event-emitter";

describe("EditorFeatures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("eventEmitter", () => {
    it("should execute eventQueue once", async () => {
      const events = new EventEmitter();
      events.emitEvent(CoreEvents.HOT_RELOAD);
      events.emitEvent(CoreEvents.HOT_RELOAD);
      const spyHotReload = vi
        .spyOn(CoreEditor.prototype, "hotReloadEvent")
        .mockImplementation(() => {});
      new CoreEditor(
        {} as unknown as Core,
        { coreEvents: events, save: { libraries: [] } } as unknown as IRunOptions["editor"],
        {} as ECSClientLibrary,
      ).runEvents();
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
          getComponents = vi.fn(() => ({ getIndex }));
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
                  __RESERVED_entityId: {
                    entityId: "ent2",
                  },
                },
                3: {
                  Position: {
                    name: "Position",
                    x: 7,
                    y: 8,
                  },
                  __RESERVED_entityId: {
                    entityId: "ent3",
                  },
                },
              } as Record<string, Record<string, any>>
            )[entity]?.[component.name];
          });
          entityFromIndex = vi.fn((index) => {
            // @todo There is an issue here, see src/editor/core-editor.ts:97
            // This is a temp fix
            return index + 1;
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
      const events = new EventEmitter();
      new CoreEditor(
        {} as unknown as Core,
        {
          save: {
            components,
            entities,
          } as any as Save,
          coreEvents: events,
        } as any as IRunOptions["editor"],
        { registry: fakeReg } as any as ECSClientLibrary,
      ).hotReloadEvent({ components, entities } as any as Save);
      expect(fakeReg.getComponents).toHaveBeenCalledWith({ name: "__RESERVED_entityId" });
      expect(getIndex).toHaveBeenNthCalledWith(1, {
        entityId: "ent2",
        name: "__RESERVED_entityId",
      });
      expect(getIndex).toHaveBeenNthCalledWith(2, {
        entityId: "ent2",
        name: "__RESERVED_entityId",
      });
      expect(getIndex).toHaveBeenNthCalledWith(3, {
        entityId: "ent3",
        name: "__RESERVED_entityId",
      });
      expect(fakeReg.getEntityComponent).toHaveBeenNthCalledWith(1, 2, { name: "Position" });
      expect(fakeReg.getEntityComponent).toHaveBeenNthCalledWith(2, 2, { name: "Bullets" });
      expect(fakeReg.getEntityComponent).toHaveBeenNthCalledWith(3, 3, { name: "Position" });
      expect(fakeReg.addComponent).toHaveBeenNthCalledWith(1, 2, { name: "Position", x: 3, y: 4 });
      expect(fakeReg.addComponent).toHaveBeenNthCalledWith(2, 2, {
        name: "Bullets",
        bulletTypes: ["fire", "water", "rocket"],
        number: 4,
      });
      expect(fakeReg.addComponent).toHaveBeenNthCalledWith(3, 3, { name: "Position", x: 7, y: 8 });
    });
  });
});
