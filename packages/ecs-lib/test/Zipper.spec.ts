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

describe("Zipper", () => {
  describe("single component", () => {
    it("should zip sequentially spawned entities with one component type", async () => {
      const m = await Module();
      const r = new m.Registry();

      for (let i = 0; i < 5; i++) {
        const e = r.spawnEntity();
        r.addComponent(e, new Velocity(i, i));
      }

      const zip = r.getZipper([Velocity]);
      expect(zip).toBeDefined();
      expect(zip).toStrictEqual([
        { Velocity: new Velocity(0, 0) },
        { Velocity: new Velocity(1, 1) },
        { Velocity: new Velocity(2, 2) },
        { Velocity: new Velocity(3, 3) },
        { Velocity: new Velocity(4, 4) },
      ]);
    });

    it("should zip non-sequential entity ids with one component type", async () => {
      const m = await Module();
      const r = new m.Registry();

      for (let i = 0; i < 5; i++) {
        const e = new m.Entity(i * 5);
        r.addComponent(e, new Velocity(i, i));
      }

      const zip = r.getZipper([Velocity]);
      expect(zip).toBeDefined();
      expect(zip[0]).toStrictEqual({ Velocity: new Velocity(0, 0) });
      expect(zip[1]).toStrictEqual({ Velocity: new Velocity(1, 1) });
      expect(zip[2]).toStrictEqual({ Velocity: new Velocity(2, 2) });
      expect(zip[3]).toStrictEqual({ Velocity: new Velocity(3, 3) });
      expect(zip[4]).toStrictEqual({ Velocity: new Velocity(4, 4) });
    });
  });

  describe("multiple components", () => {
    it("should only include entities that have all requested components", async () => {
      const m = await Module();
      const r = new m.Registry();

      for (let i = 0; i < 20; i++) {
        const e = r.spawnEntity();
        if (i % 5 === 0) r.addComponent(e, new Velocity(0, 1));
        if (i % 3 === 0) r.addComponent(e, new Position(1, 0));
      }

      const zip = r.getZipper([Velocity, Position]);
      expect(zip).toBeDefined();

      for (let i = 0; i < 20; i++) {
        if (zip[i]) {
          expect(zip[i]).toStrictEqual({
            Velocity: new Velocity(0, 1),
            Position: new Position(1, 0),
          });
        }
      }
    });
  });

  describe("mutations through zipper", () => {
    it("should reflect component mutations when zipper is re-fetched", async () => {
      const m = await Module();
      const r = new m.Registry();

      for (let i = 0; i < 20; i++) {
        const e = r.spawnEntity();
        if (i % 5 === 0) r.addComponent(e, new Velocity(0, 1));
      }

      let zip = r.getZipper([Velocity]);
      expect(zip).toBeDefined();

      for (let i = 0; i < 20; i++) {
        if (zip[i]) {
          zip[i]["Velocity"].y *= 2;
        }
      }

      zip = r.getZipper([Velocity]);
      for (let i = 0; i < 20; i++) {
        if (zip[i]) {
          expect(zip[i]).toStrictEqual({ Velocity: new Velocity(0, 2) });
        }
      }
    });
  });
});
