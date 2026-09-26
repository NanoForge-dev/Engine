import type { AppContext, EventEmitter, InitContext } from "@nanoforge-dev/common";
import { describe, expect, it, vi } from "vitest";

import { EditorCommand, EditorLibrary } from "../src";

const makeEmitter = (): EventEmitter => {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  return {
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const list = listeners.get(event) ?? [];
      list.push(listener);
      listeners.set(event, list);
    }),
    off: vi.fn(),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      for (const listener of listeners.get(event) ?? []) listener(...args);
    }),
    runEvents: vi.fn(),
  };
};

const makeInitContext = (editor?: InitContext["editor"]): InitContext => ({
  vars: { get: () => undefined, set: () => {} },
  env: {},
  files: new Map(),
  ...(editor ? { editor } : {}),
});

const makeAppContext = (): AppContext => ({
  isRunning: true,
  isPaused: false,
  delta: 0,
  tickRate: 60,
  requestStop: vi.fn(),
  requestPause: vi.fn(),
  requestResume: vi.fn(),
});

describe("EditorLibrary", () => {
  it("exposes the reserved 'editor' key", () => {
    expect(new EditorLibrary().key).toBe("editor");
  });

  it("expose().emit forwards to toEditor.emit, not fromEditor", async () => {
    const toEditor = makeEmitter();
    const fromEditor = makeEmitter();
    const lib = new EditorLibrary();
    await lib.__init(makeInitContext({ toEditor, fromEditor }));

    lib.expose().emit("move-component", "e1", "Position", { x: 1, y: 2 });

    expect(toEditor.emit).toHaveBeenCalledWith("move-component", "e1", "Position", { x: 1, y: 2 });
    expect(fromEditor.emit).not.toHaveBeenCalled();
  });

  it("expose().on forwards to fromEditor.on, not toEditor", async () => {
    const toEditor = makeEmitter();
    const fromEditor = makeEmitter();
    const lib = new EditorLibrary();
    await lib.__init(makeInitContext({ toEditor, fromEditor }));

    const handler = vi.fn();
    lib.expose().on("hot-reload", handler);

    expect(fromEditor.on).toHaveBeenCalledWith("hot-reload", handler);
    expect(toEditor.on).not.toHaveBeenCalled();
  });

  it("only exposes emit and on — the reverse two operations are not reachable", async () => {
    const lib = new EditorLibrary();
    await lib.__init(makeInitContext({ toEditor: makeEmitter(), fromEditor: makeEmitter() }));

    expect(Object.keys(lib.expose())).toEqual(["emit", "on"]);
  });

  it("__events drains fromEditor's queue each tick — not __run, so it still runs while paused", async () => {
    const toEditor = makeEmitter();
    const fromEditor = makeEmitter();
    const lib = new EditorLibrary();
    await lib.__init(makeInitContext({ toEditor, fromEditor }));

    await lib.__events({} as any);

    expect(fromEditor.runEvents).toHaveBeenCalledOnce();
  });

  it("__events does not throw when no editor bridge was provided (non-editor runs)", async () => {
    const lib = new EditorLibrary();
    await expect(lib.__init(makeInitContext())).resolves.toBeUndefined();
    await expect(lib.__events({} as any)).resolves.toBeUndefined();
  });

  describe("base commands", () => {
    it("wires EditorCommand.Pause/Resume/Stop to ctx.app once, on the first __events call", async () => {
      const toEditor = makeEmitter();
      const fromEditor = makeEmitter();
      const app = makeAppContext();
      const lib = new EditorLibrary();
      await lib.__init(makeInitContext({ toEditor, fromEditor }));

      await lib.__events({ app } as any);
      await lib.__events({ app } as any);

      expect(fromEditor.on).toHaveBeenCalledTimes(3);
      expect(fromEditor.on).toHaveBeenCalledWith(EditorCommand.Pause, expect.any(Function));
      expect(fromEditor.on).toHaveBeenCalledWith(EditorCommand.Resume, expect.any(Function));
      expect(fromEditor.on).toHaveBeenCalledWith(EditorCommand.Stop, expect.any(Function));
    });

    it("EditorCommand.Pause calls ctx.app.requestPause", async () => {
      const toEditor = makeEmitter();
      const fromEditor = makeEmitter();
      const app = makeAppContext();
      const lib = new EditorLibrary();
      await lib.__init(makeInitContext({ toEditor, fromEditor }));

      await lib.__events({ app } as any);
      fromEditor.emit(EditorCommand.Pause);

      expect(app.requestPause).toHaveBeenCalledOnce();
      expect(app.requestResume).not.toHaveBeenCalled();
      expect(app.requestStop).not.toHaveBeenCalled();
    });

    it("EditorCommand.Resume calls ctx.app.requestResume", async () => {
      const toEditor = makeEmitter();
      const fromEditor = makeEmitter();
      const app = makeAppContext();
      const lib = new EditorLibrary();
      await lib.__init(makeInitContext({ toEditor, fromEditor }));

      await lib.__events({ app } as any);
      fromEditor.emit(EditorCommand.Resume);

      expect(app.requestResume).toHaveBeenCalledOnce();
    });

    it("EditorCommand.Stop calls ctx.app.requestStop", async () => {
      const toEditor = makeEmitter();
      const fromEditor = makeEmitter();
      const app = makeAppContext();
      const lib = new EditorLibrary();
      await lib.__init(makeInitContext({ toEditor, fromEditor }));

      await lib.__events({ app } as any);
      fromEditor.emit(EditorCommand.Stop);

      expect(app.requestStop).toHaveBeenCalledOnce();
    });

    it("does not wire base commands when no editor bridge was provided", async () => {
      const lib = new EditorLibrary();
      await lib.__init(makeInitContext());

      await expect(lib.__events({ app: makeAppContext() } as any)).resolves.toBeUndefined();
    });
  });

  it("expose().emit/on throw when no editor bridge was provided, like every other library's not-initialized guard", async () => {
    const lib = new EditorLibrary();
    await lib.__init(makeInitContext());

    expect(() => lib.expose().emit("x")).toThrow();
    expect(() => lib.expose().on("x", vi.fn())).toThrow();
  });
});
