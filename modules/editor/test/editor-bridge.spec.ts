import type { AppContext, EventEmitter, TickObserver } from "@nanoforge-dev/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditorBridge } from "../src/internal/editor-bridge";
import { EDITOR_PROTOCOL_VERSION } from "../src/protocol";

class TestEmitter implements EventEmitter {
  readonly emitted: [string, ...unknown[]][] = [];
  private readonly listeners = new Map<string, ((...args: unknown[]) => void)[]>();

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
  }

  off(): void {}

  emit(event: string, ...args: unknown[]): void {
    this.emitted.push([event, ...args]);
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
  }

  runEvents(): void {}
}

const makeApp = () => {
  const observers: TickObserver[] = [];
  const app = {
    isPaused: false,
    libraries: ["ecs"],
    requestPause: vi.fn(),
    requestResume: vi.fn(),
    requestStop: vi.fn(),
    requestStep: vi.fn(),
    observeTicks: (observer: TickObserver) => void observers.push(observer),
  };
  return { app: app as unknown as AppContext, state: app, observers };
};

/** A host's serializer (the editor has its own format): enough to see where it applies. */
const serializeLogValue = (value: unknown) =>
  Array.isArray(value)
    ? { type: "cut" as const, text: `Array(${value.length})` }
    : JSON.stringify(value);

const setup = (
  bundleFile?: string,
  serialize: typeof serializeLogValue | null = serializeLogValue,
) => {
  const raw = {
    toEditor: new TestEmitter(),
    fromEditor: new TestEmitter(),
    ...(serialize && { serializeLogValue: serialize }),
  };
  const bridge = new EditorBridge(bundleFile);
  bridge.connect(raw);
  const events = (name: string) =>
    raw.toEditor.emitted.filter(([event]) => event === name).map(([, payload]) => payload);
  return { raw, bridge, events };
};

/** Logs from this file, which plays the game bundle. */
const gameLog = (...args: unknown[]) => console.log(...args);

describe("EditorBridge", () => {
  afterEach(() => vi.restoreAllMocks());

  it("says hello with the libraries once, when started", () => {
    const { bridge, events } = setup();
    const { app } = makeApp();
    bridge.start(app);
    bridge.start(app);
    expect(events("hello")).toEqual([
      { protocolVersion: EDITOR_PROTOCOL_VERSION, libraries: ["ecs"] },
    ]);
  });

  it("applies the base commands on the app", () => {
    const { raw, bridge } = setup();
    const { app, state } = makeApp();
    bridge.start(app);
    for (const command of ["pause", "resume", "step", "stop"]) raw.fromEditor.emit(command);
    expect(state.requestPause).toHaveBeenCalledOnce();
    expect(state.requestResume).toHaveBeenCalledOnce();
    expect(state.requestStep).toHaveBeenCalledOnce();
    expect(state.requestStop).toHaveBeenCalledOnce();
  });

  it("reports each run state once, from the tick loop", () => {
    const { bridge, events } = setup();
    const { app, state, observers } = makeApp();
    bridge.start(app);
    const observer = observers[0]!;
    observer.onTick!(1, 0);
    observer.onTick!(1, 10);
    state.isPaused = true;
    observer.onTick!(1, 20);
    observer.onStop!();
    expect(events("state")).toEqual(["running", "paused", "stopped"]);
    expect(observer.timings).toBe(false);
  });

  it("tells once that the first welcome arrived", () => {
    const { raw, bridge } = setup();
    expect(bridge.takeWelcomed()).toBe(false);
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: {} });
    expect(bridge.takeWelcomed()).toBe(true);
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: { logs: true } });
    expect(bridge.takeWelcomed()).toBe(false);
  });

  it("gives the console back when no editor started the app", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const bridge = new EditorBridge(import.meta.url.replace("file://", ""));
    expect(console.log).not.toBe(log);
    bridge.dispose();
    expect(console.log).toBe(log);
    expect(bridge.connected).toBe(false);
  });

  it("exposes the welcome of the editor on the facade", () => {
    const { raw, bridge } = setup();
    const facade = bridge.facade();
    expect(facade.welcome).toBeUndefined();
    const welcome = { protocolVersion: EDITOR_PROTOCOL_VERSION, features: {} };
    raw.fromEditor.emit("welcome", welcome);
    expect(facade.welcome).toEqual(welcome);
  });

  it("emits frame stats per window only once asked to", () => {
    const { raw, bridge, events } = setup();
    expect(bridge.timing).toBe(false);
    bridge.endTick(5, 1000);
    expect(events("frame-stats")).toEqual([]);

    vi.spyOn(Date, "now").mockReturnValue(0);
    raw.fromEditor.emit("welcome", {
      protocolVersion: 1,
      features: { frameStats: { intervalMs: 100 } },
    });
    expect(bridge.timing).toBe(true);
    bridge.timeLibrary("ecs", 2);
    bridge.endTick(3, 50);
    bridge.timeLibrary("ecs", 4);
    bridge.endTick(5, 100);
    bridge.endTick(1, 150);

    expect(events("frame-stats")).toEqual([
      {
        windowMs: 100,
        ticks: 2,
        tps: 20,
        tick: { avg: 4, max: 5 },
        libraries: { ecs: { avg: 3, max: 4 } },
      },
    ]);
  });

  it("keeps startup output until the welcome asks for logs, then forwards until stopped", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { raw, bridge, events } = setup(import.meta.url.replace("file://", ""));
    gameLog("before welcome");
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: { logs: true } });
    gameLog("score", { left: 1 }, 2);
    bridge.report("stopped");
    gameLog("after stop");

    expect(events("log")).toEqual([
      { level: "info", message: "before welcome" },
      { level: "info", message: 'score {"left":1} 2' },
    ]);
  });

  it("sends the logged values, snapshotted by the host, and their call site", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const file = import.meta.url.replace("file://", "");
    const { raw, events } = setup(file);
    const score = { left: 1 };
    gameLog("before welcome", [1]);
    raw.fromEditor.emit("welcome", {
      protocolVersion: 1,
      features: { logs: { values: true } },
    });
    gameLog("score", score);
    // Snapshots are taken when the line is logged.
    score.left = 2;

    const logs = events("log") as { message: string; values: unknown; caller: string }[];
    expect(logs.map((log) => log.values)).toEqual([
      ['"before welcome"', { type: "cut", text: "Array(1)" }],
      ['"score"', '{"left":1}'],
    ]);
    expect(logs[1]!.caller).toMatch(
      new RegExp(`^${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\d+:\\d+$`),
    );
  });

  it("snapshots the lines logged before the channels were known when they are", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const file = import.meta.url.replace("file://", "");
    const raw = { toEditor: new TestEmitter(), fromEditor: new TestEmitter(), serializeLogValue };
    // The library exists (console captured) before `__init` connects it.
    const bridge = new EditorBridge(file);
    gameLog("constructed", { early: true });
    bridge.connect(raw);
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: { logs: { values: true } } });
    const [log] = raw.toEditor.emitted
      .filter(([event]) => event === "log")
      .map(([, payload]) => payload);
    expect(log).toMatchObject({
      message: 'constructed {"early":true}',
      values: ['"constructed"', '{"early":true}'],
    });
    expect(log).not.toHaveProperty("args");
  });

  it("sends text only when the host gives no serializer", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { raw, events } = setup(import.meta.url.replace("file://", ""), null);
    gameLog("before welcome", [1]);
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: { logs: { values: true } } });
    gameLog("after");
    expect((events("log") as { values?: unknown }[]).map((log) => log.values)).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("sends the viewport when asked, then its changes, until stopped", () => {
    const { raw, bridge, events } = setup();
    const { app } = makeApp();
    let listener: ((state: unknown) => void) | undefined;
    const unsubscribe = vi.fn();
    const viewport = {
      state: { designWidth: 1920, scaleX: 0.5 },
      onChange: (next: (state: unknown) => void) => ((listener = next), unsubscribe),
    };
    bridge.start(app, viewport as never);
    listener!({ designWidth: 1920, scaleX: 0.4 });
    expect(events("viewport")).toEqual([]);

    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: { viewport: true } });
    listener!({ designWidth: 1920, scaleX: 0.25 });
    expect(events("viewport")).toEqual([
      { designWidth: 1920, scaleX: 0.5 },
      { designWidth: 1920, scaleX: 0.25 },
    ]);
    bridge.report("stopped");
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("drops startup output and restores the console when logs are not wanted", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { raw, events } = setup(import.meta.url.replace("file://", ""));
    gameLog("startup");
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: {} });
    expect(console.log).toBe(log);
    gameLog("later");
    expect(events("log")).toEqual([]);
  });

  it("does not forward console output of code outside the game", () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { raw, events } = setup("/somewhere/else/game.js");
    raw.fromEditor.emit("welcome", { protocolVersion: 1, features: { logs: true } });
    gameLog("editor page output");
    expect(events("log")).toEqual([]);
  });
});
