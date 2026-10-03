import { type Context, Library } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EDITOR_PROTOCOL_VERSION,
  type EditorAwareLibrary,
  EditorCommand,
  type EditorInitContext,
  EditorLibrary,
  type EditorWelcome,
  QueuedEventEmitter,
} from "../src";

class ProbeLibrary extends Library implements EditorAwareLibrary {
  readonly key = "probe";
  public received: unknown[][] = [];
  public capturedContext: Context | undefined;
  public runs = 0;
  public events = 0;
  public editorInits = 0;
  public late: unknown[][] = [];
  public welcomeAtInit: EditorWelcome | undefined;
  public eventsAtInit = -1;
  public eventsBeforeInit = -1;
  private _wired = false;

  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    ctx.editor.on("late", (...args) => this.late.push(args));
    this.editorInits++;
    this.welcomeAtInit = ctx.editor.welcome;
    this.eventsBeforeInit = this.events;
  }

  public override async __events(ctx: Context): Promise<void> {
    this.capturedContext = ctx;
    if (this.editorInits && this.eventsAtInit < 0) this.eventsAtInit = this.events;
    this.events++;
  }

  public override async __run(ctx: Context): Promise<void> {
    this.runs++;
    if (!this._wired && ctx.editor) {
      ctx.editor.on("ping", (...args) => this.received.push(args));
      this._wired = true;
    }
    ctx.editor?.emit("pong");
  }
}

/** A server started by an editor, with the editor library registered last. */
const start = (tickRate: number) => {
  const toEditor = new QueuedEventEmitter();
  const fromEditor = new QueuedEventEmitter();
  const emitted: [string, unknown[]][] = [];
  for (const event of ["hello", "state", "frame-stats"]) {
    toEditor.on(event, (...args) => emitted.push([event, args]));
  }
  const server = NanoforgeFactory.createServer({ tickRate });
  const probe = new ProbeLibrary();
  server.use(probe);
  server.use(new EditorLibrary());
  const events = (name: string) => {
    toEditor.runEvents();
    return emitted.filter(([event]) => event === name).map(([, args]) => args);
  };
  const ready = server.init({ files: new Map(), env: {}, editor: { toEditor, fromEditor } });
  return { server, probe, toEditor, fromEditor, events, ready };
};

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

  it("leaves ctx.editor undefined without EditorLibrary or without an editor host", async () => {
    vi.useFakeTimers();

    const unregistered = NanoforgeFactory.createServer({ tickRate: 60 });
    const probe = new ProbeLibrary();
    unregistered.use(probe);
    await unregistered.init({
      files: new Map(),
      env: {},
      editor: { toEditor: new QueuedEventEmitter(), fromEditor: new QueuedEventEmitter() },
    });
    await unregistered.run();
    await vi.advanceTimersByTimeAsync(1);
    expect(probe.capturedContext!.editor).toBeUndefined();

    const hostless = NanoforgeFactory.createServer({ tickRate: 60 });
    const other = new ProbeLibrary();
    hostless.use(new EditorLibrary());
    hostless.use(other);
    await hostless.init({ files: new Map(), env: {} });
    await hostless.run();
    await vi.advanceTimersByTimeAsync(1);
    expect(other.capturedContext!.editor).toBeUndefined();
    expect(other.editorInits).toBe(0);
  });

  it("says hello on the first tick and reports the run state", async () => {
    vi.useFakeTimers();
    const { server, toEditor, fromEditor, events, ready } = start(100);
    await ready;
    await server.run();
    await vi.advanceTimersByTimeAsync(1);

    expect(events("hello")).toEqual([
      [{ protocolVersion: EDITOR_PROTOCOL_VERSION, libraries: ["assets", "probe", "editor"] }],
    ]);

    fromEditor.emit(EditorCommand.Pause);
    await vi.advanceTimersByTimeAsync(20);
    fromEditor.emit(EditorCommand.Resume);
    await vi.advanceTimersByTimeAsync(20);
    fromEditor.emit(EditorCommand.Stop);
    await vi.advanceTimersByTimeAsync(30);
    toEditor.runEvents();

    expect(events("state")).toEqual([["running"], ["paused"], ["running"], ["stopped"]]);
  });

  it("applies a command on the tick it arrives in, though registered last", async () => {
    vi.useFakeTimers();
    const { server, probe, fromEditor, ready } = start(100);
    await ready;
    await server.run();
    await vi.advanceTimersByTimeAsync(1);
    fromEditor.emit(EditorCommand.Pause);
    await vi.advanceTimersByTimeAsync(10);
    const runs = probe.runs;
    await vi.advanceTimersByTimeAsync(50);
    expect(probe.runs).toBe(runs);

    fromEditor.emit(EditorCommand.Step);
    await vi.advanceTimersByTimeAsync(50);
    expect(probe.runs).toBe(runs + 1);
  });

  it("calls __editorInit once, when the welcome arrives, with the welcome set", async () => {
    vi.useFakeTimers();
    const { server, probe, fromEditor, ready } = start(100);
    await ready;
    await server.run();
    await vi.advanceTimersByTimeAsync(50);
    expect(probe.editorInits).toBe(0);

    const welcome = { protocolVersion: EDITOR_PROTOCOL_VERSION, features: {} };
    fromEditor.emit(EditorCommand.Welcome, welcome);
    await vi.advanceTimersByTimeAsync(50);
    expect(probe.editorInits).toBe(1);
    expect(probe.welcomeAtInit).toEqual(welcome);
    // Wired before the libraries' own __events of that tick.
    expect(probe.eventsBeforeInit).toBe(probe.eventsAtInit);

    fromEditor.emit(EditorCommand.Welcome, { ...welcome, features: { logs: true } });
    await vi.advanceTimersByTimeAsync(50);
    expect(probe.editorInits).toBe(1);
    expect(probe.capturedContext!.editor!.welcome!.features).toEqual({ logs: true });
  });

  it("misses the commands drained with the first welcome in listeners added by __editorInit", async () => {
    vi.useFakeTimers();
    const { server, probe, fromEditor, ready } = start(100);
    await ready;
    await server.run();
    await vi.advanceTimersByTimeAsync(1);

    fromEditor.emit(EditorCommand.Welcome, { protocolVersion: 1, features: {} });
    fromEditor.emit("late", "same tick");
    await vi.advanceTimersByTimeAsync(20);
    fromEditor.emit("late", "next tick");
    await vi.advanceTimersByTimeAsync(20);

    expect(probe.late).toEqual([["next tick"]]);
  });

  it("sends frame stats with the time of each library once asked to", async () => {
    vi.useFakeTimers();
    const { server, fromEditor, toEditor, events, ready } = start(100);
    await ready;
    await server.run();
    fromEditor.emit(EditorCommand.Welcome, {
      protocolVersion: EDITOR_PROTOCOL_VERSION,
      features: { frameStats: { intervalMs: 50 } },
    });
    await vi.advanceTimersByTimeAsync(200);
    toEditor.runEvents();

    const stats = events("frame-stats").map(([s]) => s as { libraries: Record<string, unknown> });
    expect(stats.length).toBeGreaterThan(0);
    expect(Object.keys(stats.at(-1)!.libraries)).toEqual(
      expect.arrayContaining(["probe", "editor"]),
    );
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
