import type { AppContext, TickObserver, ViewportContext } from "@nanoforge-dev/common";

import {
  EDITOR_PROTOCOL_VERSION,
  EditorBridgeCommand,
  EditorBridgeEvent,
  type EditorChannels,
  type EditorContextApi,
  type EditorLog,
  type EditorLogValue,
  type EditorRunState,
  type EditorTiming,
  type EditorWelcome,
} from "../protocol";

const CONSOLE_LEVELS = {
  debug: "debug",
  log: "info",
  info: "info",
  warn: "warn",
  error: "error",
} as const satisfies Record<string, EditorLog["level"]>;

/** File and position of a stack frame: `<file or URL>:<line>:<column>`. */
const FRAME = /((?:https?|file):\/\/[^\s)]+?|\/[^\s):]+?):(\d+):(\d+)\)?\s*$/;

/** File of the bundle this module was built into (the game's), from a stack trace. */
const ownFile = (): string | undefined => {
  const frames = new Error().stack?.split("\n") ?? [];
  for (const frame of frames) {
    const match = FRAME.exec(frame);
    if (match) return match[1];
  }
  return undefined;
};
const BUNDLE_FILE = ownFile();
/**
 * A console line waiting for the editor's welcome. `args` are the logged values
 * themselves, kept only until the host's serializer is known (`connect`).
 */
type PendingLog = EditorLog & { args?: unknown[] };

/** Console lines kept until the editor says whether it wants them. */
const MAX_PENDING_LOGS = 200;

const format = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ?? `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

class TimingWindow {
  private _count = 0;
  private _total = 0;
  private _max = 0;

  add(ms: number): void {
    this._count++;
    this._total += ms;
    if (ms > this._max) this._max = ms;
  }

  take(): EditorTiming {
    const timing = { avg: this._count ? this._total / this._count : 0, max: this._max };
    this._count = this._total = this._max = 0;
    return timing;
  }
}

/**
 * The game side of the editor bridge (`RunOptions.editor`), behind
 * `EditorLibrary`: base commands, run state reports, the `Context.editor`
 * facade and the optional features an editor asks for in its `welcome`
 * (frame stats, console output).
 */
export class EditorBridge {
  private _raw: EditorChannels | undefined;
  private _welcome: EditorWelcome | undefined;
  /** A first welcome arrived and nobody took it yet (see `takeWelcomed`). */
  private _welcomed = false;
  private _greeted = false;
  private _reported: EditorRunState | undefined;
  private _restoreConsole: (() => void) | undefined;
  /** Console output of the game before the welcome (`buffer`), then forwarded or not. */
  private _logMode: "buffer" | "forward" | "off" = "buffer";
  private readonly _pendingLogs: PendingLog[] = [];
  /** The host's serializer of logged values (`EditorChannels.serializeLogValue`). */
  private _serialize: ((value: unknown) => EditorLogValue) | undefined;
  private _viewport: ViewportContext | undefined;
  private _stopViewport: (() => void) | undefined;
  /** The editor wants the logged values and call sites, not only text (`logs.values`). */
  private _logValues = false;
  private _droppedLogs = 0;
  private _windowStart = 0;
  private _ticks = 0;
  private readonly _tick = new TimingWindow();
  private readonly _libraries = new Map<string, TimingWindow>();

  constructor(
    /** File whose frames mark game code in stack traces (tests override it). */
    private readonly _bundleFile: string | undefined = BUNDLE_FILE,
  ) {
    // Startup output of the game (library init, main) comes before the welcome: keep it.
    this._captureConsole();
  }

  /** Whether an editor started the app (`connect` was called). */
  get connected(): boolean {
    return this._raw !== undefined;
  }

  /** Takes the channels of the editor that started the app. */
  connect(raw: EditorChannels): void {
    this._raw = raw;
    const serialize = raw.serializeLogValue;
    this._serialize = serialize;
    // Lines logged before the channels were known: snapshot them now, or keep their text.
    for (const log of this._pendingLogs) {
      if (log.args && serialize) log.values = log.args.map((arg) => serialize(arg));
      delete log.args;
    }
    raw.fromEditor.on(EditorBridgeCommand.Welcome, (...args: unknown[]) =>
      this._onWelcome(args[0] as EditorWelcome),
    );
  }

  /** No editor started the app: gives the console back. */
  dispose(): void {
    this._pendingLogs.length = 0;
    this._logMode = "off";
    this._restoreConsole?.();
  }

  /**
   * First tick: wires the base commands and the run state reports on the
   * app, then tells the editor the app is initialized (`hello`).
   */
  start(app: AppContext, viewport?: ViewportContext): void {
    if (!this._raw || this._greeted) return;
    this._greeted = true;
    this._viewport = viewport;
    this._stopViewport = viewport?.onChange((state) => {
      if (this._welcome?.features.viewport)
        this._raw?.toEditor.emit(EditorBridgeEvent.Viewport, state);
    });
    const from = this._raw.fromEditor;
    from.on(EditorBridgeCommand.Pause, () => app.requestPause());
    from.on(EditorBridgeCommand.Resume, () => app.requestResume());
    from.on(EditorBridgeCommand.Stop, () => app.requestStop());
    from.on(EditorBridgeCommand.Step, () => app.requestStep());
    app.observeTicks(this._observer(app));
    this._raw?.toEditor.emit(EditorBridgeEvent.Hello, {
      protocolVersion: EDITOR_PROTOCOL_VERSION,
      libraries: [...app.libraries],
    });
  }

  /** Whether the first welcome arrived since the last call (consumed). */
  takeWelcomed(): boolean {
    const welcomed = this._welcomed;
    this._welcomed = false;
    return welcomed;
  }

  /** `Context.editor`. */
  facade(): EditorContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const bridge = this;
    return {
      get welcome() {
        return bridge._welcome;
      },
      emit: (event: string, ...args: unknown[]) => this._raw?.toEditor.emit(event, ...args),
      on: (event: string, listener: (...args: never[]) => void) =>
        this._raw?.fromEditor.on(event, listener as (...args: unknown[]) => void),
      off: (event: string, listener: (...args: never[]) => void) =>
        this._raw?.fromEditor.off(event, listener as (...args: unknown[]) => void),
    };
  }

  /** Applies queued editor commands (start of each tick, also while paused). */
  drain(): void {
    this._raw?.fromEditor.runEvents();
  }

  report(state: EditorRunState): void {
    if (state === this._reported) return;
    this._reported = state;
    this._raw?.toEditor.emit(EditorBridgeEvent.State, state);
    if (state === "stopped") {
      this._restoreConsole?.();
      this._stopViewport?.();
      this._stopViewport = undefined;
    }
  }

  /** Whether hook timings are collected (the editor asked for frame stats). */
  get timing(): boolean {
    return this._welcome?.features.frameStats !== undefined;
  }

  timeLibrary(key: string, ms: number): void {
    let window = this._libraries.get(key);
    if (!window) this._libraries.set(key, (window = new TimingWindow()));
    window.add(ms);
  }

  /** Ends a tick: records its duration and emits `frame-stats` when the window is over. */
  endTick(ms: number, now: number): void {
    const stats = this._welcome?.features.frameStats;
    if (!stats) return;
    this._ticks++;
    this._tick.add(ms);
    const windowMs = now - this._windowStart;
    if (windowMs < stats.intervalMs) return;
    this._raw?.toEditor.emit(EditorBridgeEvent.FrameStats, {
      windowMs,
      ticks: this._ticks,
      tps: (this._ticks * 1000) / windowMs,
      tick: this._tick.take(),
      libraries: Object.fromEntries(
        [...this._libraries].map(([key, window]) => [key, window.take()]),
      ),
    });
    this._ticks = 0;
    this._windowStart = now;
  }

  private _observer(app: AppContext): TickObserver {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const bridge = this;
    return {
      get timings() {
        return bridge.timing;
      },
      onHook: (key, ms) => this.timeLibrary(key, ms),
      onTick: (ms, now) => {
        this.report(app.isPaused ? "paused" : "running");
        this.endTick(ms, now);
      },
      onStop: () => this.report("stopped"),
    };
  }

  private _onWelcome(welcome: EditorWelcome): void {
    if (!this._welcome) this._welcomed = true;
    this._welcome = welcome;
    this._windowStart = Date.now();
    // The viewport as it is now; later changes come from `onChange`.
    if (welcome.features.viewport && this._viewport)
      this._raw?.toEditor.emit(EditorBridgeEvent.Viewport, this._viewport.state);
    const logs = welcome.features.logs;
    if (logs) {
      this._logMode = "forward";
      this._logValues = typeof logs === "object" && logs.values === true;
      if (this._droppedLogs) {
        this._raw?.toEditor.emit(EditorBridgeEvent.Log, {
          level: "warn",
          message: `${this._droppedLogs} earlier console lines of the game were dropped`,
        });
      }
      for (const log of this._pendingLogs.splice(0)) this._emitLog(log);
    } else {
      this._logMode = "off";
      this._pendingLogs.length = 0;
      this._restoreConsole?.();
    }
    this._droppedLogs = 0;
  }

  private _emitLog(log: PendingLog): void {
    const { level, message, values, caller } = log;
    this._raw?.toEditor.emit(
      EditorBridgeEvent.Log,
      this._logValues
        ? { level, message, ...(values && { values }), ...(caller && { caller }) }
        : { level, message },
    );
  }

  /**
   * Captures console calls made by the game's code (a frame of the game
   * bundle below the console call). Calls of the editor page itself — a
   * client runs in it — are not forwarded, which also rules out loops.
   */
  private _captureConsole(): void {
    if (this._restoreConsole || !this._bundleFile) return;
    const bundle = this._bundleFile;
    const originals = new Map<string, (...args: unknown[]) => void>();
    let forwarding = false;
    for (const [method, level] of Object.entries(CONSOLE_LEVELS)) {
      const console_ = console as unknown as Record<string, (...args: unknown[]) => void>;
      const original = console_[method];
      if (!original) continue;
      originals.set(method, original);
      console_[method] = (...args: unknown[]) => {
        original.apply(console, args);
        if (forwarding) return;
        const callers = new Error().stack?.split("\n").slice(2) ?? [];
        const caller = callers.find((frame) => frame.includes(bundle));
        if (!caller) return;
        forwarding = true;
        try {
          const log: PendingLog = { level, message: args.map(format).join(" ") };
          // Before the welcome nobody knows whether values are wanted: keep them. Snapshots
          // are the host's: before `connect`, the values themselves wait for its serializer.
          if (this._logValues || this._logMode === "buffer") {
            const serialize = this._serialize;
            if (serialize) log.values = args.map((arg) => serialize(arg));
            else if (!this._raw) log.args = args;
            const frame = FRAME.exec(caller);
            if (frame) log.caller = `${frame[1]}:${frame[2]}:${frame[3]}`;
          }
          if (this._logMode === "forward") this._emitLog(log);
          else if (this._pendingLogs.length < MAX_PENDING_LOGS) this._pendingLogs.push(log);
          else this._droppedLogs++;
        } finally {
          forwarding = false;
        }
      };
    }
    this._restoreConsole = () => {
      for (const [method, original] of originals) {
        (console as unknown as Record<string, unknown>)[method] = original;
      }
      this._restoreConsole = undefined;
    };
  }
}
