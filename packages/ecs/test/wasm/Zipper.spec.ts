import Module from "../../lib/libecs.js";

class Velocity {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

describe("Zipper", () => {
  test("basic instantation", async () => {
    const m = await Module();
    const v = new m.MapStringSparseArray();

    const zip = new m.Zipper(v);

    expect(zip).toBeDefined();
    expect(zip.getValue()).toBeUndefined();
  });

  test("single simple sparse array instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    for (let i = 0; i < 5; i++) {
      const e = r.spawnEntity();
      r.addComponent(e, new Velocity(i, i));
    }

    const zip = r.getZipper([Velocity]);
    expect(zip).toBeDefined();

    for (let i = 0; i < 5; i++, zip.next()) {
      expect(zip.getValue()).toStrictEqual({ Velocity: new Velocity(i, i) });
    }
    expect(zip.getValue()).toBeUndefined();
  });

  test("single complex sparse array instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    for (let i = 0; i < 5; i++) {
      const e = new m.Entity(i * 5);
      r.addComponent(e, new Velocity(i, i));
    }

    const zip = r.getZipper([Velocity]);
    expect(zip).toBeDefined();

    for (let i = 0; i < 5; i++) {
      expect(zip.getValue()).toStrictEqual({ Velocity: new Velocity(i, i) });
      zip.next();
    }
    expect(zip.getValue()).toBeUndefined();
  });

  test("multiple complex sparse array instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    for (let i = 0; i < 20; i++) {
      const e = r.spawnEntity();
      if (i % 5 === 0) {
        r.addComponent(e, new Velocity(0, i));
      }
      if (i % 3 === 0) {
        r.addComponent(e, new Position(i, 0));
      }
    }

    const zip = r.getZipper([Velocity, Position]);
    expect(zip).toBeDefined();

    for (let i = 0; i < 20; i++) {
      if (i % 3 === 0 && i % 5 === 0) {
        expect(zip.getValue()).toStrictEqual({
          Velocity: new Velocity(0, i),
          Position: new Position(i, 0),
        });
        zip.next();
      }
    }
    expect(zip.getValue()).toBeUndefined();
  });

  test("simple zipper modification", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    for (let i = 0; i < 20; i++) {
      const e = r.spawnEntity();
      if (i % 5 === 0) {
        r.addComponent(e, new Velocity(0, i));
      }
    }

    let zip = r.getZipper([Velocity]);
    expect(zip).toBeDefined();

    for (let i = 0; i < 20; i++) {
      if (i % 5 === 0) {
        const vel = zip.getValue()["Velocity"];
        vel.y *= 2;
        zip.next();
      }
    }

    zip = r.getZipper([Velocity]);
    for (let i = 0; i < 20; i++) {
      if (i % 5 === 0) {
        expect(zip.getValue()).toStrictEqual({
          Velocity: new Velocity(0, i * 2),
        });
        zip.next();
      }
    }
    expect(zip.getValue()).toBeUndefined();
  });
});
