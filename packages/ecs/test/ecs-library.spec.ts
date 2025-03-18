import { ECSLibrary } from "../src/ecs-library";

class Position {
  constructor(
    public x: number,
    public y: number,
  ) {
    this.x = x;
    this.y = y;
  }
}

describe("ECSLibrary", () => {
  test("init and spawn entity", async () => {
    const ecs = new ECSLibrary("public");
    await ecs.init();
    const entity = ecs.createEntity();
    expect(entity).toBeDefined();
    expect(entity.get_id()).toBe(0);
  });

  test("add component to entity", async () => {
    const ecs = new ECSLibrary("public/");
    await ecs.init();
    const entity = ecs.createEntity();
    const pos = new Position(1, 2);
    ecs.addComponent(entity, pos);
    const components = ecs.getComponents(Position);
    expect(components.get(entity.get_id())).toStrictEqual(new Position(1, 2));
    expect(components.size()).toBe(1);
  });

  test("clear", async () => {
    const ecs = new ECSLibrary("public/");
    await ecs.init();
    await ecs.clear();
  });
});
