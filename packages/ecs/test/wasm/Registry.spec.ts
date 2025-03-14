import Module from "../../public/libecs";

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

describe("Registry", () => {
  test("1 entity 2 components", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const vel = new Velocity(1, 2);
    const pos = new Position(4, 5);

    const e = r.spawn_entity();
    expect(e.get_id()).toBe(0);

    r.add_component(e, vel);
    r.add_component(e, pos);

    const velocities = r.get_components(Velocity);
    const positions = r.get_components(Position);

    expect(velocities.get(e.get_id())).toStrictEqual(new Velocity(1, 2));
    expect(positions.get(e.get_id())).toStrictEqual(new Position(4, 5));
  });

  test("override components", async () => {
    const m = await Module();
    const r = new m.Registry();

    const vel = new Velocity(1, 2);
    const vel2 = new Velocity(4, 5);

    const e = r.spawn_entity();

    r.add_component(e, vel);
    expect(r.get_components(Velocity).get(e.get_id())).toStrictEqual(new Velocity(1, 2));

    r.add_component(e, vel2);
    expect(r.get_components(Velocity).get(e.get_id())).toStrictEqual(new Velocity(4, 5));
  });

  test("basic remove", async () => {
    const m = await Module();
    const r = new m.Registry();

    const vel = new Velocity(1, 2);
    const e = r.spawn_entity();

    r.add_component(e, vel);
    expect(r.get_components(Velocity).get(e.get_id())).toStrictEqual(new Velocity(1, 2));

    r.remove_component(e, Velocity);
    expect(r.get_components(Velocity).size()).toEqual(1);
    expect(r.get_components(Velocity).get(e.get_id())).toBeUndefined();
  });

  test("basic kill", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const vel = new Velocity(1, 2);
    const pos = new Position(4, 5);

    r.spawn_entity();
    const e = r.spawn_entity();
    expect(e.get_id()).toBe(1);

    r.add_component(e, vel);
    r.add_component(e, pos);

    const velocities = r.get_components(Velocity);
    const positions = r.get_components(Position);

    expect(positions.size()).toEqual(2);
    expect(velocities.get(e.get_id())).toStrictEqual(new Velocity(1, 2));
    expect(positions.get(e.get_id())).toStrictEqual(new Position(4, 5));

    r.kill_entity(e);
    expect(r.get_components(Velocity).get(e.get_id())).toBeUndefined();
    expect(r.get_components(Position).get(e.get_id())).toBeUndefined();
  });

  test("system incrementing a variable", async () => {
    const m = await Module();
    const r = new m.Registry();

    let counter = 0;

    r.add_system(() => {
      counter += 1;
    });

    for (let i = 0; i <= 15; i++) {
      expect(counter).toBe(i);
      r.run_systems();
    }
    expect(counter).toBe(16);
  });

  test("system incrementing component positions by velocity", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const e = r.spawn_entity();
    const e2 = r.spawn_entity();
    expect(e2.get_id()).toBe(1);
    const e3 = r.spawn_entity();

    r.add_component(e, new Velocity(1, 1));
    r.add_component(e, new Position(-2, -2));

    r.add_component(e2, new Velocity(-1, -1));
    r.add_component(e2, new Position(2, 2));

    r.add_component(e3, new Position(0, 0));

    r.add_system(() => {
      const velocities = r.get_components(Velocity);
      const positions = r.get_components(Position);
      for (let i = 0; i < velocities.size() && i < positions.size(); i++) {
        if (velocities.get(i) === undefined || positions.get(i) === undefined) {
          continue;
        }
        positions.get(i).x += velocities.get(i).x;
        positions.get(i).y += velocities.get(i).y;
      }
    });

    expect(r.get_components(Position).size()).toEqual(3);

    expect(r.get_components(Position).get(e.get_id())).toStrictEqual(new Position(-2, -2));
    expect(r.get_components(Position).get(e2.get_id())).toStrictEqual(new Position(2, 2));
    expect(r.get_components(Position).get(e3.get_id())).toStrictEqual(new Position(0, 0));
    r.run_systems();

    expect(r.get_components(Position).get(e.get_id())).toStrictEqual(new Position(-1, -1));
    expect(r.get_components(Position).get(e2.get_id())).toStrictEqual(new Position(1, 1));
    expect(r.get_components(Position).get(e3.get_id())).toStrictEqual(new Position(0, 0));
    r.run_systems();

    expect(r.get_components(Position).get(e.get_id())).toStrictEqual(new Position(0, 0));
    expect(r.get_components(Position).get(e2.get_id())).toStrictEqual(new Position(0, 0));
    expect(r.get_components(Position).get(e3.get_id())).toStrictEqual(new Position(0, 0));
  });
});
