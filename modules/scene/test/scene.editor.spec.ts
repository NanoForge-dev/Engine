import type { Context } from "@nanoforge-dev/common";
import type { EditorContextApi, EditorInitContext } from "@nanoforge-dev/editor-lib";
import { describe, expect, it } from "vitest";

import { type EditorScenes, Scene, SceneLibrary, type SceneLoadContext } from "../src";

const ids: string[] = [];

class Game extends Scene {
  override load(ctx: Context, { id }: SceneLoadContext): void {
    ids.push(id);
    ctx.scenes.vars.init("lives", 3);
  }
}
class Level extends Scene<{ seed: number }> {
  static override parent = Game;
  override load(ctx: Context, { id }: SceneLoadContext<{ seed: number }>): void {
    ids.push(id);
    ctx.scenes.vars.init("bricks", 10);
  }
}
// Its class name differs from its id, as after a bundler renamed it.
const Renamed = class Pause2 extends Scene {};

const editorFor = () => {
  const events: EditorScenes[] = [];
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const api = {
    welcome: { protocolVersion: 1, features: { scenes: { intervalMs: 0 } } },
    emit: (event: string, ...args: unknown[]) =>
      event === "scenes" && events.push(args[0] as EditorScenes),
    on: (event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener),
  } as unknown as EditorContextApi;
  const send = (event: string, ...args: unknown[]) => listeners.get(event)?.(...args);
  return { api, events, send };
};

const setup = async () => {
  ids.length = 0;
  const library = new SceneLibrary({ scenes: { Game, Level1: Level, Pause: Renamed } });
  await library.__init();
  const editor = editorFor();
  const ctx = { scenes: library.expose(), editor: editor.api } as unknown as Context;
  await library.__editorInit(ctx as EditorInitContext);
  return { library, ctx, editor, tick: () => library.__run(ctx) };
};

describe("SceneLibrary and the editor", () => {
  it("names scenes by their key in scenes, else by their class name", async () => {
    const { ctx, tick, library } = await setup();
    class Other extends Scene {}
    void ctx.scenes.load(ctx, Level);
    await tick();
    expect(ids).toEqual(["Game", "Level1"]);
    void ctx.scenes.load(ctx, Other, { parent: "current" });
    await tick();
    expect(library.manager.chain.map(({ id }) => id)).toEqual(["Game", "Level1", "Other"]);
  });

  it("sends the loaded scenes and the vars when they change", async () => {
    const { ctx, tick, editor } = await setup();
    void ctx.scenes.load(ctx, Level, { params: { seed: 2 } });
    ctx.scenes.vars.init("best", 7, { persistent: true });
    await tick();
    expect(editor.events.at(-1)).toEqual({
      loaded: [
        { id: "Game", params: null },
        { id: "Level1", params: { seed: 2 } },
      ],
      vars: [
        { key: "best", value: 7, persistent: true },
        { key: "lives", value: 3, owner: "Game", persistent: false },
        { key: "bricks", value: 10, owner: "Level1", persistent: false },
      ],
      known: ["Game", "Level1", "Pause"],
    });
    const count = editor.events.length;
    await tick();
    expect(editor.events).toHaveLength(count);
  });

  it("loads, unloads and sets vars on the editor's commands", async () => {
    const { tick, editor, library } = await setup();
    editor.send("scenes-load", "Level1", { seed: 5 });
    await tick();
    expect(library.manager.chain).toEqual([
      { id: "Game", params: undefined },
      { id: "Level1", params: { seed: 5 } },
    ]);
    editor.send("scenes-load", "Pause", undefined, "current");
    await tick();
    expect(library.manager.chain.map(({ id }) => id)).toEqual(["Game", "Level1", "Pause"]);
    editor.send("scenes-unload", "Level1");
    editor.send("scenes-set-var", "lives", 1);
    await tick();
    expect(library.manager.chain.map(({ id }) => id)).toEqual(["Game"]);
    expect(library.manager.vars.get("lives")).toBe(1);
  });

  it("sends nothing when the editor did not ask for scenes", async () => {
    const library = new SceneLibrary();
    await library.__init();
    const editor = editorFor();
    const api = { ...editor.api, welcome: { protocolVersion: 1, features: {} } };
    const ctx = { scenes: library.expose(), editor: api } as unknown as Context;
    await library.__editorInit(ctx as EditorInitContext);
    await library.__run(ctx);
    expect(editor.events).toEqual([]);
  });
});
