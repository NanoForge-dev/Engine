import { describe, expect, it } from "vitest";

import Module from "../lib/libecs";

class Velocity {
  name: string = "Velocity";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class Position {
  name: string = "Position";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

describe("Registry", () => {
  describe("entity management", () => {
    it("should spawn an entity with id 0", async () => {
      const m = await Module();
      const r = new m.Registry();
      const e = r.spawnEntity();
      expect(e.getId()).toBe(0);
    });

    it("should assign incrementing ids to spawned entities", async () => {
      const m = await Module();
      const r = new m.Registry();
      const e0 = r.spawnEntity();
      const e1 = r.spawnEntity();
      expect(e0.getId()).toBe(0);
      expect(e1.getId()).toBe(1);
    });

    it("should kill an entity and remove all its components", async () => {
      const m = await Module();
      const r = new m.Registry();

      r.spawnEntity();
      const e = r.spawnEntity();
      expect(e.getId()).toBe(1);

      r.addComponent(e, new Velocity(1, 2));
      r.addComponent(e, new Position(4, 5));

      r.killEntity(e);
      expect(r.getComponents(Velocity).get(e.getId())).toBeUndefined();
      expect(r.getComponents(Position).get(e.getId())).toBeUndefined();
    });
  });

  describe("component management", () => {
    it("should add multiple components to a single entity", async () => {
      const m = await Module();
      const r = new m.Registry();

      const e = r.spawnEntity();
      r.addComponent(e, new Velocity(1, 2));
      r.addComponent(e, new Position(4, 5));

      expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(1, 2));
      expect(r.getComponents(Position).get(e.getId())).toStrictEqual(new Position(4, 5));
    });

    it("should override an existing component on an entity", async () => {
      const m = await Module();
      const r = new m.Registry();

      const e = r.spawnEntity();
      r.addComponent(e, new Velocity(1, 2));
      expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(1, 2));

      r.addComponent(e, new Velocity(4, 5));
      expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(4, 5));
    });

    it("should remove a component from an entity", async () => {
      const m = await Module();
      const r = new m.Registry();

      const e = r.spawnEntity();
      r.addComponent(e, new Velocity(1, 2));
      expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(1, 2));

      r.removeComponent(e, Velocity);
      expect(r.getComponents(Velocity).size()).toEqual(1);
      expect(r.getComponents(Velocity).get(e.getId())).toBeUndefined();
    });

    it("should reject the reserved 'entity' component name", async () => {
      const m = await Module();
      const r = new m.Registry();

      const e = r.spawnEntity();
      expect(() => r.addComponent(e, { name: "entity" })).toThrow();
    });
  });

  describe("system management", () => {
    it("should run a system that increments a counter", async () => {
      const m = await Module();
      const r = new m.Registry();

      let counter = 0;
      r.addSystem(() => {
        counter += 1;
      });

      for (let i = 0; i <= 15; i++) {
        expect(counter).toBe(i);
        r.runSystems({});
      }
      expect(counter).toBe(16);
    });

    it("should run a system that updates positions by velocity", async () => {
      const m = await Module();
      const r = new m.Registry();

      const e = r.spawnEntity();
      const e2 = r.spawnEntity();
      expect(e2.getId()).toBe(1);
      const e3 = r.spawnEntity();

      r.addComponent(e, new Velocity(1, 1));
      r.addComponent(e, new Position(-2, -2));
      r.addComponent(e2, new Velocity(-1, -1));
      r.addComponent(e2, new Position(2, 2));
      r.addComponent(e3, new Position(0, 0));

      r.addSystem(() => {
        const velocities = r.getComponents(Velocity);
        const positions = r.getComponents(Position);
        for (let i = 0; i < velocities.size() && i < positions.size(); i++) {
          if (velocities.get(i) === undefined || positions.get(i) === undefined) continue;
          positions.get(i).x += velocities.get(i).x;
          positions.get(i).y += velocities.get(i).y;
        }
      });

      expect(r.getComponents(Position).size()).toEqual(3);

      r.runSystems({});
      expect(r.getComponents(Position).get(e.getId())).toStrictEqual(new Position(-1, -1));
      expect(r.getComponents(Position).get(e2.getId())).toStrictEqual(new Position(1, 1));
      expect(r.getComponents(Position).get(e3.getId())).toStrictEqual(new Position(0, 0));

      r.runSystems({});
      expect(r.getComponents(Position).get(e.getId())).toStrictEqual(new Position(0, 0));
      expect(r.getComponents(Position).get(e2.getId())).toStrictEqual(new Position(0, 0));
      expect(r.getComponents(Position).get(e3.getId())).toStrictEqual(new Position(0, 0));
    });
  });
});
