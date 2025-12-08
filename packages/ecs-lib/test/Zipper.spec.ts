import { describe, expect, it } from "vitest";

import Module from "../lib/libecs";

class Velocity {
  name: string = "Velocity";
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Position {
  name: string = "Position";
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

describe("Zipper", () => {
  it("single simple sparse array instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

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

  it("single complex sparse array instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

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

  it("multiple complex sparse array instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    for (let i = 0; i < 20; i++) {
      const e = r.spawnEntity();
      if (i % 5 === 0) r.addComponent(e, new Velocity(0, 1));
      if (i % 3 === 0) r.addComponent(e, new Position(1, 0));
    }

    const zip = r.getZipper([Velocity, Position]);
    expect(zip).toBeDefined();

    console.log(zip);
    for (let i = 0; i < 20; i++) {
      if (zip[i]) {
        expect(zip[i]).toStrictEqual({
          Velocity: new Velocity(0, 1),
          Position: new Position(1, 0),
        });
      }
    }
  });

  it("simple indexed zipper modification", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    for (let i = 0; i < 20; i++) {
      const e = r.spawnEntity();
      if (i % 5 === 0) {
        r.addComponent(e, new Velocity(0, 1));
      }
    }

    let zip = r.getZipper([Velocity]);
    expect(zip).toBeDefined();

    for (let i = 0; i < 20; i++) {
      if (zip[i]) {
        const vel = zip[i]["Velocity"];
        vel.y *= 2;
      }
    }

    zip = r.getZipper([Velocity]);
    for (let i = 0; i < 20; i++) {
      if (zip[i]) {
        expect(zip[i]).toStrictEqual({
          Velocity: new Velocity(0, 2),
        });
      }
    }
  });
});
