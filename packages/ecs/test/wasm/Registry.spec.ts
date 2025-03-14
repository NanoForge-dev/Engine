import Module from "../../public/libecs";
import { couch } from "globals";

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
  test("basic instantation", async () => {
    const m = await Module();
    const r = new m.Registry();
    expect(r).toBeDefined();

    const vel = new Velocity(1, 2);
    const pos = new Position(4, 5);

    const e = r.spawn_entity();
    expect(e.get_id()).toBe(0);

    console.log("reg vel");
//    r.add_component(e, vel);
    console.log("reg pos");
    r.add_component(e, pos);

    const velocities = r.get_components(Velocity);
    const positions = r.get_components(Position);

    expect(velocities.get(e.get_id())).toStrictEqual(new Velocity(1, 2));
    expect(positions.get(e.get_id())).toStrictEqual(new Position(4, 5));
  });

  test("basic insert", async () => {
    const m = await Module();
    const r = new m.Registry();
    r.set(0, 1);
    expect(r.size()).toBe(1);
    expect(r.get(0)).toBe(1);
  });

  test("basic remove", async () => {
    const m = await Module();
    const r = new m.Registry();
    r.set(0, 1);
    r.erase(0);
    expect(r.size()).toBe(1);
    expect(r.get(0)).toBe(undefined);
  });

  test("basic iteration", async () => {
    const m = await Module();
    const r = new m.Registry();
    r.set(0, 1);
    r.set(1, 2);
    r.set(2, 3);
    let sum = 0;
    for (let i = 0; i < r.size(); i++) {
      sum += r.get(i);
    }
    expect(sum).toBe(6);
  });
});
