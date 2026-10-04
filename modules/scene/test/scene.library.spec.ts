import { type Context, Library } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NfSceneCycleException, Scene, SceneLibrary, type SceneLoadContext } from "../src";

const events: string[] = [];

/** Records its hooks, and inits a var named after it. */
abstract class Probe<TParams = undefined> extends Scene<TParams> {
  override load(ctx: Context, { params }: SceneLoadContext<TParams>): void {
    events.push(`load ${this.constructor.name}${params ? ` ${JSON.stringify(params)}` : ""}`);
    ctx.scenes.vars.init(`${this.constructor.name}.var`, true);
  }

  override unload(): void {
    events.push(`unload ${this.constructor.name}`);
  }
}

/**
 * Root of the game.
 *
 * @scene
 * @side shared
 */
class Game extends Probe {}
/**
 * First level.
 *
 * @scene
 * @side shared
 * @vars score
 */
class Level1 extends Probe<{ seed: number }> {
  static override parent = Game;
}
class RoomA extends Probe {
  static override parent = Level1;
}
class Level2 extends Probe {
  static override parent = Game;
}
class Pause extends Probe {}

/** A library that is set up and ticked by hand, with a stand-in context. */
const setup = async () => {
  events.length = 0;
  const library = new SceneLibrary();
  await library.__init();
  const ctx = { scenes: library.expose() } as unknown as Context;
  const tick = () => library.__run(ctx);
  return { library, ctx, scenes: ctx.scenes, tick };
};

describe("SceneLibrary", () => {
  it("has the 'scenes' key and runs after every other library", () => {
    const library = new SceneLibrary();
    expect(library.key).toBe("scenes");
    expect(library.relationships.runBefore).toEqual(["*"]);
  });

  it("throws when used before init", () => {
    expect(() => new SceneLibrary().manager).toThrow();
  });

  it("queues a change until the next tick", async () => {
    const { ctx, scenes, tick } = await setup();
    const done = scenes.load(ctx, RoomA);
    expect(scenes.loaded).toEqual([]);
    await tick();
    await expect(done).resolves.toBeUndefined();
    expect(events).toEqual(["load Game", "load Level1", "load RoomA"]);
    expect(scenes.current).toBeInstanceOf(RoomA);
    expect(scenes.loaded.map((scene) => scene.constructor)).toEqual([Game, Level1, RoomA]);
    expect(scenes.isLoaded(Level1)).toBe(true);
  });

  it("gives the params to the scene asked for only", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Level1, { params: { seed: 3 } });
    await tick();
    expect(events).toEqual(["load Game", 'load Level1 {"seed":3}']);
  });

  it("moves to a child, a parent, a sibling and a cousin", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Level1);
    await tick();

    events.length = 0;
    void scenes.load(ctx, RoomA);
    await tick();
    expect(events).toEqual(["load RoomA"]);

    events.length = 0;
    void scenes.load(ctx, Level1);
    await tick();
    expect(events).toEqual(["unload RoomA"]);

    events.length = 0;
    void scenes.load(ctx, Level2);
    await tick();
    expect(events).toEqual(["unload Level1", "load Level2"]);

    void scenes.load(ctx, RoomA);
    await tick();
    events.length = 0;
    void scenes.load(ctx, Level2);
    await tick();
    expect(events).toEqual(["unload RoomA", "unload Level1", "load Level2"]);
  });

  it("creates a new instance at each load", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Level1);
    await tick();
    const first = scenes.current;
    void scenes.load(ctx, Level2);
    void scenes.load(ctx, Level1);
    await tick();
    expect(scenes.current).toBeInstanceOf(Level1);
    expect(scenes.current).not.toBe(first);
  });

  it("loads a scene under the parent given, or the current scene", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Level1);
    void scenes.load(ctx, Pause, { parent: "current" });
    await tick();
    expect(scenes.loaded.map((scene) => scene.constructor)).toEqual([Game, Level1, Pause]);

    events.length = 0;
    void scenes.unload(ctx, Pause);
    await tick();
    expect(events).toEqual(["unload Pause"]);
    expect(scenes.current).toBeInstanceOf(Level1);

    void scenes.load(ctx, Pause, { parent: Level2 });
    await tick();
    expect(scenes.loaded.map((scene) => scene.constructor)).toEqual([Game, Level2, Pause]);
  });

  it("unloads a scene and the scenes under it, or nothing when it is not loaded", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, RoomA);
    await tick();
    events.length = 0;
    await Promise.all([scenes.unload(ctx, Level2), scenes.unload(ctx, Game), tick()]);
    expect(events).toEqual(["unload RoomA", "unload Level1", "unload Game"]);
    expect(scenes.current).toBeUndefined();
  });

  it("removes the vars of unloaded scenes, and keeps the others", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, RoomA);
    await tick();
    scenes.vars.set("score", 3); // owned by the current scene, RoomA
    scenes.vars.init("best", 3, { persistent: true });
    expect(scenes.vars.keys().sort()).toEqual([
      "Game.var",
      "Level1.var",
      "RoomA.var",
      "best",
      "score",
    ]);

    void scenes.load(ctx, Level2);
    await tick();
    expect(scenes.vars.keys().sort()).toEqual(["Game.var", "Level2.var", "best"]);
  });

  it("runs changes asked by a scene's hooks in the same tick", async () => {
    class Redirect extends Scene {
      override load(ctx: Context): void {
        void ctx.scenes.load(ctx, Level2);
      }
    }
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Redirect);
    await tick();
    expect(scenes.current).toBeInstanceOf(Level2);
  });

  it("rejects the load and fails the tick when a hook throws", async () => {
    const error = new Error("broken");
    class Broken extends Scene {
      override load(ctx: Context): void {
        ctx.scenes.vars.init("broken", true);
        throw error;
      }
    }
    const { ctx, scenes, tick } = await setup();
    const done = scenes.load(ctx, Broken);
    await expect(tick()).rejects.toBe(error);
    await expect(done).rejects.toBe(error);
    expect(scenes.current).toBeUndefined();
    expect(scenes.vars.has("broken")).toBe(false);
  });

  it("rejects a cycle", async () => {
    const { ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Level1);
    await tick();
    const done = scenes.load(ctx, Game, { parent: Level1 });
    await expect(tick()).rejects.toBeInstanceOf(NfSceneCycleException);
    await expect(done).rejects.toBeInstanceOf(NfSceneCycleException);
  });

  it("drops the scenes and vars at clear, without calling unload", async () => {
    const { library, ctx, scenes, tick } = await setup();
    void scenes.load(ctx, Level1);
    await tick();
    const pending = scenes.load(ctx, Level2);
    events.length = 0;
    await library.__clear();
    expect(events).toEqual([]);
    expect(scenes.loaded).toEqual([]);
    expect(scenes.vars.keys()).toEqual([]);
    await expect(pending).rejects.toThrow(/stopped/);
  });
});

describe("SceneLibrary in an application", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the initial scene before the first tick's systems, and changes after them", async () => {
    vi.useFakeTimers();
    const ticks: string[] = [];

    class Systems extends Library {
      readonly key = "systems";
      private _ticks = 0;

      override async __run(ctx: Context): Promise<void> {
        ticks.push(ctx.scenes.current?.constructor.name ?? "none");
        if (++this._ticks === 1) void ctx.scenes.load(ctx, Level2);
        if (this._ticks === 3) ctx.app.requestStop();
      }
    }

    events.length = 0;
    const app = NanoforgeFactory.createServer({ tickRate: 10 });
    app.use(new SceneLibrary({ initial: Level1, params: { seed: 1 } }));
    app.use(new Systems());
    await app.init({ files: new Map(), env: {} });
    await app.run();
    await vi.advanceTimersByTimeAsync(500);

    expect(ticks).toEqual(["Level1", "Level2", "Level2"]);
    expect(events).toEqual(["load Game", 'load Level1 {"seed":1}', "unload Level1", "load Level2"]);
  });
});
