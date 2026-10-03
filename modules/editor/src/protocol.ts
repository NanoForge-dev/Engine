import type { Context, EventEmitter, ViewportState } from "@nanoforge-dev/common";

/**
 * Raw editor bridge (`RunOptions.editor`), supplied by whoever starts the app
 * under an editor host. `EditorLibrary` turns this pair into the single
 * `Context.editor` facade every library sees.
 */
export interface EditorChannels {
  /** Engine → editor channel. */
  toEditor: EventEmitter;
  /** Editor → engine channel. Drained by `EditorLibrary` at the start of every tick. */
  fromEditor: EventEmitter;
  /**
   * Snapshots a logged value in the editor's format, at the moment it is
   * logged. Supplied by a host that runs the game in its own page (the editor
   * runs clients this way), which owns the format. Without it, `log` events
   * carry text only, even when the editor asks for values.
   */
  serializeLogValue?: (value: unknown) => EditorLogValue;
}

/**
 * Version of the editor ↔ engine bridge protocol. Sent by the engine in the
 * {@link EditorBridgeEvent.Hello} event and by the editor in the
 * {@link EditorBridgeCommand.Welcome} command, so each side can detect a
 * mismatch. See `docs/editor-protocol.md`.
 */
export const EDITOR_PROTOCOL_VERSION = 1;

/**
 * Editor → engine commands handled by `EditorLibrary` itself, sent on
 * `RunOptions.editor.fromEditor`.
 */
export enum EditorBridgeCommand {
  /** Answer to `hello`: the editor's protocol version and the features it wants. */
  Welcome = "welcome",
  Pause = "pause",
  Resume = "resume",
  /** Runs exactly one tick while paused. */
  Step = "step",
  Stop = "stop",
  /** Payload: muted (boolean). Handled by the sound and music libraries. */
  Mute = "mute",
}

/** Engine → editor events, on `RunOptions.editor.toEditor`. */
export enum EditorBridgeEvent {
  /** Emitted once the app is initialized. Payload: {@link EditorHello}. */
  Hello = "hello",
  /** Emitted on every run state change. Payload: {@link EditorRunState}. */
  State = "state",
  /** Sampled tick timings, when requested. Payload: {@link EditorFrameStats}. */
  FrameStats = "frame-stats",
  /** Console output of the game, when requested. Payload: {@link EditorLog}. */
  Log = "log",
  /** Network packets, when requested (network library). Payload: {@link EditorNetworkTrace}. */
  NetworkTrace = "network-trace",
  /** Network totals per second, when traces are requested. Payload: {@link EditorNetworkStats}. */
  NetworkStats = "network-stats",
  /** The game's viewport, when requested (clients). Payload: {@link EditorViewport}. */
  Viewport = "viewport",
}

export interface EditorHello {
  protocolVersion: number;
  /** Keys of the registered libraries (`ecs`, `graphics`, `network`…). */
  libraries: string[];
}

/** Optional engine features the editor turns on in its `welcome`. */
export interface EditorFeatures {
  /** Emit `frame-stats` every `intervalMs`. */
  frameStats?: { intervalMs: number };
  /**
   * Forward the game's console output as `log` events. With `values`, each
   * event also carries the logged values and where the game logged them.
   */
  logs?: boolean | { values?: boolean };
  /**
   * Emit `network-trace` events: a `sampleRate` share of packets, at most
   * `maxPerSecond`, each with the first `maxBytes` bytes of its payload; and
   * `network-stats` totals every second.
   */
  networkTrace?: { sampleRate?: number; maxPerSecond?: number; maxBytes?: number };
  /**
   * Emit `viewport` events: the game's viewport when the editor asks for it,
   * then on every change. Clients only (a server has no viewport).
   */
  viewport?: boolean;
}

/**
 * How game coordinates map to the game's container, in CSS px: a point
 * `(x, y)` of the game is drawn at
 * `(contentLeft + originX + x * scaleX, contentTop + originY + y * scaleY)`.
 */
export type EditorViewport = ViewportState;

export interface EditorWelcome {
  protocolVersion: number;
  features: EditorFeatures;
}

/**
 * - `running` / `paused`: the loop is ticking (paused ticks only drain events).
 * - `stopped`: every library was cleared and the viewport disposed.
 */
export type EditorRunState = "running" | "paused" | "stopped";

/** Duration statistics in milliseconds over one sampling window. */
export interface EditorTiming {
  avg: number;
  max: number;
}

export interface EditorFrameStats {
  /** Length of the sampling window (ms). */
  windowMs: number;
  /** Ticks run in the window (paused ticks included). */
  ticks: number;
  /** Ticks per second over the window. */
  tps: number;
  /** Whole tick (events + run of every library). */
  tick: EditorTiming;
  /** Per library key: `__events` + `__run`. */
  libraries: Record<string, EditorTiming>;
}

export interface EditorLog {
  level: "debug" | "info" | "warn" | "error";
  /** The arguments of the console call, as one line of text. */
  message: string;
  /** The arguments as trees (`logs.values`), made by the host's `serializeLogValue`. */
  values?: EditorLogValue[];
  /** Where the game logged it (`logs.values`): `<bundle file or URL>:<line>:<column>`. */
  caller?: string;
}

/**
 * A logged value as a JSON tree: a snapshot limited in depth and size, which
 * an editor can show expanded.
 */
export type EditorLogValue =
  | string
  | number
  | boolean
  | null
  | { readonly type: "undefined" }
  /** Numbers JSON cannot carry: `NaN`, `Infinity`, `-Infinity`, `-0`. */
  | { readonly type: "number"; readonly text: string }
  | { readonly type: "bigint" | "symbol" | "function" | "date"; readonly text: string }
  | {
      readonly type: "error";
      readonly name: string;
      readonly message: string;
      readonly stack?: string;
    }
  | {
      readonly type: "object";
      /** Constructor name, for instances of classes. */
      readonly name?: string;
      readonly entries: readonly (readonly [string, EditorLogValue])[];
      /** Entries left out. */
      readonly more?: number;
    }
  | {
      readonly type: "array";
      /** `Set`, `Float32Array`… for array-likes that are not arrays. */
      readonly name?: string;
      readonly length: number;
      readonly items: readonly EditorLogValue[];
      readonly more?: number;
    }
  | {
      readonly type: "map";
      readonly size: number;
      readonly entries: readonly (readonly [EditorLogValue, EditorLogValue])[];
      readonly more?: number;
    }
  /** A value already shown higher in the tree. */
  | { readonly type: "circular" }
  /** A value deeper than the limit: only its summary is kept. */
  | { readonly type: "cut"; readonly text: string };

export interface EditorNetworkTrace {
  direction: "in" | "out";
  transport: "tcp" | "udp";
  /** Server side: the client the packet goes to or comes from. */
  clientId?: string;
  size: number;
  /** First bytes, hex encoded. */
  head: string;
  /** The first `maxBytes` bytes, hex encoded (when the editor asked for them). */
  data?: string;
  /** ms since epoch. */
  time: number;
}

/** Packets and bytes of one direction over a window. */
export interface EditorNetworkTotals {
  packets: number;
  bytes: number;
}

/** Totals of every packet over a window, traced or not. */
export interface EditorNetworkStats {
  /** Length of the window (ms). */
  windowMs: number;
  /** End of the window, ms since epoch. */
  time: number;
  tcp: { in: EditorNetworkTotals; out: EditorNetworkTotals };
  udp: { in: EditorNetworkTotals; out: EditorNetworkTotals };
  /** Packets left out of the `network-trace` events (sampling, rate limit). */
  untraced: number;
}

/** Arguments of each editor → engine command. Libraries add theirs by augmentation. */
export interface EditorCommandMap {
  welcome: [EditorWelcome];
  pause: [];
  resume: [];
  step: [];
  stop: [];
  /** Mutes (true) or unmutes the game's sounds and music, on top of the game's own state. */
  mute: [boolean];
}

/** Payload of each engine → editor event. Libraries add theirs by augmentation. */
export interface EditorEventMap {
  hello: [EditorHello];
  state: [EditorRunState];
  "frame-stats": [EditorFrameStats];
  log: [EditorLog];
  "network-trace": [EditorNetworkTrace];
  "network-stats": [EditorNetworkStats];
  viewport: [EditorViewport];
}

/**
 * `Context.editor`: set by `EditorLibrary` whenever the app was started by
 * an editor (`RunOptions.editor`), `undefined` otherwise.
 *
 * @remarks
 * Deliberately asymmetric: libraries emit events to the editor and listen
 * to its commands, never the reverse, so no library can impersonate the
 * editor or eavesdrop on what others send.
 */
export interface EditorContextApi {
  /** The editor's `welcome`, once received (features it asked for). */
  readonly welcome: EditorWelcome | undefined;
  /** Sends an event to the editor. */
  emit<K extends keyof EditorEventMap & string>(event: K, ...args: EditorEventMap[K]): void;
  emit(event: string, ...args: unknown[]): void;
  /** Listens to a command of the editor. */
  on<K extends keyof EditorCommandMap & string>(
    event: K,
    listener: (...args: EditorCommandMap[K]) => void,
  ): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: never[]) => void): void;
}

/** `Context` of an app started by an editor, as handed to `__editorInit`. */
export type EditorInitContext = Context & { readonly editor: EditorContextApi };

/**
 * A library with one-time editor wiring.
 *
 * @remarks
 * `EditorLibrary` calls `__editorInit` on every registered library that has
 * it, once, in run order, when the editor's `welcome` arrives — so
 * `ctx.editor.welcome` is set. It is never called when no editor started
 * the app. Listen to the editor's commands and install editor-only behavior
 * here instead of checking `ctx.editor` on every tick.
 *
 * @example
 * ```ts
 * class SoundLibrary extends Library implements EditorAwareLibrary {
 *   async __editorInit(ctx: EditorInitContext) {
 *     ctx.editor.on("mute", (muted) => this.setMuted(muted));
 *   }
 * }
 * ```
 */
export interface EditorAwareLibrary {
  __editorInit(ctx: EditorInitContext): void | Promise<void>;
}

/** Name of the hook `EditorLibrary` calls on the editor's `welcome`. */
export const EDITOR_INIT_HOOK = "__editorInit";
