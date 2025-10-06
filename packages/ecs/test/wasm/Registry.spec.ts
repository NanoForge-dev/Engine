import Module from "../../lib/libecs.js";

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

describe("Registry", () => {
  test("1 entity 2 components", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const vel = new Velocity(1, 2);
    const pos = new Position(4, 5);

    const e = r.spawnEntity();
    expect(e.getId()).toBe(0);

    r.addComponent(e, vel);
    r.addComponent(e, pos);

    const velocities = r.getComponents(Velocity);
    const positions = r.getComponents(Position);

    expect(velocities.get(e.getId())).toStrictEqual(new Velocity(1, 2));
    expect(positions.get(e.getId())).toStrictEqual(new Position(4, 5));
  });

  test("override components", async () => {
    const m = await Module();
    const r = new m.Registry();

    const vel = new Velocity(1, 2);
    const vel2 = new Velocity(4, 5);

    const e = r.spawnEntity();

    r.addComponent(e, vel);
    expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(1, 2));

    r.addComponent(e, vel2);
    expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(4, 5));
  });

  test("basic remove", async () => {
    const m = await Module();
    const r = new m.Registry();

    const vel = new Velocity(1, 2);
    const e = r.spawnEntity();

    r.addComponent(e, vel);
    expect(r.getComponents(Velocity).get(e.getId())).toStrictEqual(new Velocity(1, 2));

    r.removeComponent(e, Velocity);
    expect(r.getComponents(Velocity).size()).toEqual(1);
    expect(r.getComponents(Velocity).get(e.getId())).toBeUndefined();
  });

  test("basic kill", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const vel = new Velocity(1, 2);
    const pos = new Position(4, 5);

    r.spawnEntity();
    const e = r.spawnEntity();
    expect(e.getId()).toBe(1);

    r.addComponent(e, vel);
    r.addComponent(e, pos);

    const velocities = r.getComponents(Velocity);
    const positions = r.getComponents(Position);

    expect(positions.size()).toEqual(2);
    expect(velocities.get(e.getId())).toStrictEqual(new Velocity(1, 2));
    expect(positions.get(e.getId())).toStrictEqual(new Position(4, 5));

    r.killEntity(e);
    expect(r.getComponents(Velocity).get(e.getId())).toBeUndefined();
    expect(r.getComponents(Position).get(e.getId())).toBeUndefined();
  });

  test("system incrementing a variable", async () => {
    const m = await Module();
    const r = new m.Registry();

    let counter = 0;

    r.addSystem(() => {
      counter += 1;
    });

    for (let i = 0; i <= 15; i++) {
      expect(counter).toBe(i);
      r.runSystems(null);
    }
    expect(counter).toBe(16);
  });

  test("system incrementing component positions by velocity", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

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
        if (velocities.get(i) === undefined || positions.get(i) === undefined) {
          continue;
        }
        positions.get(i).x += velocities.get(i).x;
        positions.get(i).y += velocities.get(i).y;
      }
    });

    expect(r.getComponents(Position).size()).toEqual(3);

    expect(r.getComponents(Position).get(e.getId())).toStrictEqual(new Position(-2, -2));
    expect(r.getComponents(Position).get(e2.getId())).toStrictEqual(new Position(2, 2));
    expect(r.getComponents(Position).get(e3.getId())).toStrictEqual(new Position(0, 0));
    r.runSystems(null);

    expect(r.getComponents(Position).get(e.getId())).toStrictEqual(new Position(-1, -1));
    expect(r.getComponents(Position).get(e2.getId())).toStrictEqual(new Position(1, 1));
    expect(r.getComponents(Position).get(e3.getId())).toStrictEqual(new Position(0, 0));
    r.runSystems(null);

    expect(r.getComponents(Position).get(e.getId())).toStrictEqual(new Position(0, 0));
    expect(r.getComponents(Position).get(e2.getId())).toStrictEqual(new Position(0, 0));
    expect(r.getComponents(Position).get(e3.getId())).toStrictEqual(new Position(0, 0));
  });

  test("Try unallowed component name", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const entityComp = { name: "entity" };

    const e = r.spawnEntity();
    expect(e.getId()).toBe(0);

    try {
      r.addComponent(e, entityComp);
      fail();
    } catch (e) {
      //@ts-ignore
      expect(m.getExceptionMessage(e)[1].toString()).toBeDefined();
    }
  });
});
