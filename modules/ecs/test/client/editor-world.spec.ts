import type { Context, InitContext } from "@nanoforge-dev/common";
import type { EditorContextApi, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { beforeAll, describe, expect, it } from "vitest";

import { EcsLibrary } from "../../src/client";
import { callSiteOf, toEditorValue } from "../../src/shared/editor-world";

class Position {
  name = "Position";
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class Rect {
  constructor(public width = 1) {}
  draw() {}
}

class Shape {
  name = "Shape";
  constructor(public shape: Rect) {}
}

/** A fake `Context.editor`: records emitted events, lets tests send commands. */
const fakeEditor = () => {
  const emitted: [string, unknown[]][] = [];
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  const api = {
    welcome: { protocolVersion: 1, features: { ecsWorld: { intervalMs: 0 } } },
    emit: (event: string, ...args: unknown[]) => void emitted.push([event, args]),
    on: (event: string, listener: (...args: unknown[]) => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
      return () => undefined;
    },
  } as unknown as EditorContextApi;
  const send = (event: string, ...args: unknown[]) =>
    listeners.get(event)?.forEach((listener) => listener(...args));
  return { api, emitted, send };
};

const initContext = (): InitContext =>
  ({
    vars: { get: () => undefined, set: () => {} },
    env: {},
    files: new Map([["/libecs.wasm", "./lib/web/libecs.wasm"]]),
    editor: { toEditor: {}, fromEditor: { on: () => undefined } },
  }) as unknown as InitContext;

describe("EditorWorldTracker (live mode)", () => {
  let ecs: EcsLibrary;
  const editor = fakeEditor();
  const ctx = { editor: editor.api } as unknown as Context;
  let ranMove = 0;

  beforeAll(async () => {
    ecs = new EcsLibrary();
    await ecs.__init(initContext());
    const registry = ecs.registry;
    const ball = registry.spawnEntity();
    registry.addComponent(ball, new Position(1, 2));
    registry.addComponent(ball, new Shape(new Rect(3)));
    registry.addSystem(function move() {
      ranMove++;
    });
    await ecs.__editorInit(ctx as EditorInitContext);
    await ecs.__events(ctx);
  });

  const lastWorld = () =>
    editor.emitted.filter(([event]) => event === "ecs-world").at(-1)![1][0] as {
      entities: {
        id: number;
        site?: { line: number };
        components: { name: string; value: Record<string, unknown> }[];
      }[];
      systems: { name: string; enabled: boolean }[];
    };

  it("sends the world with the call site of each spawn", () => {
    const world = lastWorld();
    expect(world.entities).toHaveLength(1);
    expect(world.entities[0]!.site?.line).toBeGreaterThan(0);
    expect(world.entities[0]!.components).toEqual([
      { name: "Position", value: { $class: "Position", name: "Position", x: 1, y: 2 } },
      {
        name: "Shape",
        value: { $class: "Shape", name: "Shape", shape: { $class: "Rect", width: 3 } },
      },
    ]);
    expect(world.systems).toEqual([{ index: 0, name: "move", enabled: true }]);
  });

  it("applies the editor's changes", async () => {
    const id = lastWorld().entities[0]!.id;
    editor.send("ecs-set-component", id, "Position", "x", 42);
    editor.send("ecs-spawn-entity");
    editor.send("ecs-add-component", id + 1, "Position", [5, 6]);
    await ecs.__events(ctx);
    const world = lastWorld();
    expect(world.entities[0]!.components[0]!.value.x).toBe(42);
    expect(world.entities[1]).toMatchObject({
      components: [{ name: "Position", value: { x: 5, y: 6 } }],
    });
    expect(world.entities[1]!.site).toBeUndefined;

    editor.send("ecs-remove-component", id + 1, "Position");
    editor.send("ecs-remove-entity", id + 1);
    await ecs.__events(ctx);
    expect(lastWorld().entities).toHaveLength(1);
  });

  it("pauses a system", async () => {
    await ecs.__run(ctx);
    expect(ranMove).toBe(1);
    editor.send("ecs-set-system-enabled", 0, false);
    await ecs.__run(ctx);
    expect(ranMove).toBe(1);
    await ecs.__events(ctx);
    expect(lastWorld().systems[0]!.enabled).toBe(false);
  });
});

describe("system timings", () => {
  it("times each system per window once the editor asks for it", async () => {
    const ecs = new EcsLibrary();
    await ecs.__init(initContext());
    const editor = fakeEditor();
    const features = (editor.api.welcome as { features: Record<string, unknown> }).features;
    const ctx = { editor: editor.api } as unknown as Context;
    ecs.registry.addSystem(function slow() {
      const end = performance.now() + 2;
      while (performance.now() < end);
    });
    ecs.registry.addSystem(function paused() {});
    const stats = () =>
      editor.emitted.filter(([event]) => event === "ecs-system-stats").map(([, args]) => args[0]);

    await ecs.__editorInit(ctx as EditorInitContext);

    // Not asked for: nothing is timed or sent.
    await ecs.__events(ctx);
    await ecs.__run(ctx);
    await ecs.__events(ctx);
    expect(stats()).toEqual([]);

    features["ecsSystemStats"] = { intervalMs: 0 };
    await ecs.__events(ctx);
    editor.send("ecs-set-system-enabled", 1, false);
    await ecs.__run(ctx);
    await ecs.__run(ctx);
    await new Promise((resolve) => setTimeout(resolve, 2));
    await ecs.__events(ctx);
    const last = stats().at(-1) as {
      windowMs: number;
      systems: { index: number; name: string; calls: number; avg: number; max: number }[];
    };
    expect(last.windowMs).toBeGreaterThan(0);
    expect(last.systems.map((system) => [system.index, system.name, system.calls])).toEqual([
      [0, "slow", 2],
      [1, "paused", 0],
    ]);
    expect(last.systems[0]!.avg).toBeGreaterThanOrEqual(1.5);
    expect(last.systems[0]!.max).toBeGreaterThanOrEqual(last.systems[0]!.avg);
    expect(last.systems[1]).toMatchObject({ avg: 0, max: 0 });

    // A new window starts from zero.
    await new Promise((resolve) => setTimeout(resolve, 2));
    await ecs.__events(ctx);
    expect((stats().at(-1) as typeof last).systems[0]!.calls).toBe(0);
  });
});

describe("helpers", () => {
  it("reads the caller's frame", () => {
    expect(
      callSiteOf(
        "Error\n    at spawnEntity (http://x/main.js:10:5)\n    at main (http://localhost:4790/runtime/p/client/main.js:120:27)",
      ),
    ).toEqual({ file: "http://localhost:4790/runtime/p/client/main.js", line: 120, column: 27 });
    expect(callSiteOf("Error\n    at a (/x.js:1:1)\n    at /srv/game/dist/main.js:7:3")).toEqual({
      file: "/srv/game/dist/main.js",
      line: 7,
      column: 3,
    });
  });

  it("keeps JSON values and names classes", () => {
    expect(toEditorValue({ a: [1, "b", true], f: () => 1, _private: 1, n: Number.NaN })).toEqual({
      a: [1, "b", true],
      n: null,
    });
  });
});
