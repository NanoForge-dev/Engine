import { type Context, Library } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditorCommand, EditorLibrary, QueuedEventEmitter } from "../src";

class ProbeLibrary extends Library {
  readonly key = "probe";
  public received: unknown[][] = [];
  public capturedContext: Context | undefined;
  private _wired = false;

  public override async __events(ctx: Context): Promise<void> {
    this.capturedContext = ctx;
  }

  public override async __run(ctx: Context): Promise<void> {
    if (!this._wired && ctx.editor) {
      ctx.editor.on("ping", (...args) => this.received.push(args));
      this._wired = true;
    }
    ctx.editor?.emit("pong");
  }
}

describe("editor bridge integration with @nanoforge-dev/core", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("wires RunOptions.editor through core's generic InitContext spread into ctx.editor for every library", async () => {
    vi.useFakeTimers();

    const toEditor = new QueuedEventEmitter();
    const fromEditor = new QueuedEventEmitter();
    const toEditorListener = vi.fn();
    toEditor.on("pong", toEditorListener);

    const server = NanoforgeFactory.createServer({ tickRate: 60 });
    const probe = new ProbeLibrary();
    server.use(new EditorLibrary());
    server.use(probe);

    await server.init({ files: new Map(), env: {}, editor: { toEditor, fromEditor } });
    await server.run();

    await vi.advanceTimersByTimeAsync(1);

    toEditor.runEvents();
    expect(toEditorListener).toHaveBeenCalled();

    fromEditor.emit("ping", "hello");
    await vi.advanceTimersByTimeAsync(50);

    expect(probe.received).toEqual([["hello"]]);
  });

  it("leaves ctx.editor undefined when the app isn't started under an editor host", async () => {
    vi.useFakeTimers();

    const server = NanoforgeFactory.createServer({ tickRate: 60 });
    const probe = new ProbeLibrary();
    server.use(probe);

    await server.init({ files: new Map(), env: {} });
    await server.run();
    await vi.advanceTimersByTimeAsync(1);

    expect(probe.received).toEqual([]);
  });

  it("EditorCommand.Pause/Resume/Stop reach Context.app with no app-side wiring required", async () => {
    vi.useFakeTimers();

    const toEditor = new QueuedEventEmitter();
    const fromEditor = new QueuedEventEmitter();

    const server = NanoforgeFactory.createServer({ tickRate: 1000 });
    const probe = new ProbeLibrary();
    server.use(new EditorLibrary());
    server.use(probe);

    await server.init({ files: new Map(), env: {}, editor: { toEditor, fromEditor } });
    await server.run();
    await vi.advanceTimersByTimeAsync(10);

    fromEditor.emit(EditorCommand.Pause);
    await vi.advanceTimersByTimeAsync(10);

    expect(probe.capturedContext!.app.isPaused).toBe(true);

    fromEditor.emit(EditorCommand.Resume);
    await vi.advanceTimersByTimeAsync(10);

    expect(probe.capturedContext!.app.isPaused).toBe(false);

    fromEditor.emit(EditorCommand.Stop);
    await vi.advanceTimersByTimeAsync(10);

    expect(probe.capturedContext!.app.isRunning).toBe(false);
  });
});
