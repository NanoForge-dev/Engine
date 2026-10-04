import type { Context, InitContext } from "@nanoforge-dev/common";
import type { EditorContextApi, EditorInitContext } from "@nanoforge-dev/editor-lib";
import type { SceneLoadContext } from "@nanoforge-dev/scene";
import { beforeEach, describe, expect, it } from "vitest";

import { EcsLibrary, type Registry } from "../../src/client";
import { EcsScene } from "../../src/scene";

class Position {
  name = "Position";
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

class Shape {
  name = "Shape";
  destroyed = false;
  destroy() {
    this.destroyed = true;
  }
}

const ran: string[] = [];
const shape = new Shape();
let spawnLine = 0;

function move() {
  ran.push("move");
}
function draw() {
  ran.push("draw");
}
function hud() {
  ran.push("hud");
}

class Level extends EcsScene<{ seed: number }> {
  seed?: number;
  tornDown = false;

  override setup(
    registry: Registry,
    _ctx: Context,
    { params }: SceneLoadContext<{ seed: number }>,
  ) {
    this.seed = params?.seed;
    spawnLine = Number(new Error().stack?.split("\n")[1]?.match(/:(\d+):\d+\)?$/)?.[1]) + 1;
    const ball = registry.spawnEntity();
    registry.addComponent(ball, new Position(1, 2));
    registry.addComponent(ball, shape);
    registry.addSystem(move);
    registry.addSystem(draw);
  }

  override teardown(): void {
    this.tornDown = true;
  }
}

const initContext = (editor: boolean): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map([["/libecs.wasm", "./lib/web/libecs.wasm"]]),
    ...(editor && { editor: { toEditor: {}, fromEditor: { on: () => undefined } } }),
  }) as unknown as InitContext;

const world = () => {
  const emitted: unknown[] = [];
  const api = {
    welcome: { protocolVersion: 1, features: { ecsWorld: { intervalMs: 0 } } },
    emit: (event: string, ...args: unknown[]) => event === "ecs-world" && emitted.push(args[0]),
    on: () => () => undefined,
  } as unknown as EditorContextApi;
  return {
    api,
    last: () =>
      emitted.at(-1) as {
        entities: { site?: { line: number }; scene?: string }[];
        systems: { name: string }[];
      },
  };
};

describe("EcsScene", () => {
  let ecs: EcsLibrary;
  let ctx: Context;
  const editor = world();

  beforeEach(async () => {
    ran.length = 0;
    shape.destroyed = false;
    ecs = new EcsLibrary();
    await ecs.__init(initContext(true));
    ctx = { ecs: ecs.expose(), editor: editor.api } as unknown as Context;
    await ecs.__editorInit(ctx as EditorInitContext);
    ecs.registry.addSystem(hud);
  });

  it("makes its entities and systems in setup, with the params", async () => {
    const level = new Level();
    await level.load(ctx, { id: "Level1", params: { seed: 4 } });
    expect(level.seed).toBe(4);
    await ecs.__run(ctx);
    expect(ran).toEqual(["hud", "move", "draw"]);
  });

  it("records the scene and the line of setup that spawned each entity", async () => {
    await new Level().load(ctx, { id: "Level1", params: undefined });
    await ecs.__events(ctx);
    const [entity] = editor.last().entities;
    expect(entity?.scene).toBe("Level1");
    expect(entity?.site?.line).toBe(spawnLine);
  });

  it("removes its systems by function and its entities at unload, destroying components", async () => {
    const level = new Level();
    await level.load(ctx, { id: "Level1", params: undefined });
    ecs.registry.addSystem(function after() {
      ran.push("after");
    });
    await level.unload(ctx);

    expect(level.tornDown).toBe(true);
    expect(shape.destroyed).toBe(true);
    await ecs.__run(ctx);
    expect(ran).toEqual(["hud", "after"]);
    await ecs.__events(ctx);
    expect(editor.last().entities).toEqual([]);
    expect(editor.last().systems.map(({ name }) => name)).toEqual(["hud", "after"]);
  });

  it("works without an editor", async () => {
    const plain = new EcsLibrary();
    await plain.__init(initContext(false));
    const plainCtx = { ecs: plain.expose() } as unknown as Context;
    const level = new Level();
    await level.load(plainCtx, { id: "Level1", params: undefined });
    await level.unload(plainCtx);
    ran.length = 0;
    await plain.__run(plainCtx);
    expect(ran).toEqual([]);
  });
});
