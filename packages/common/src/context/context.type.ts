import type { NfFile } from "../common/file";

/**
 * Read-only application state plus the actions available to affect it.
 *
 * @remarks
 * `AppContext` deliberately exposes no setters — mutation only happens
 * internally, inside `@nanoforge-dev/core`. Game code and libraries can read
 * state and call actions, but can never reach into and directly overwrite
 * engine-owned state.
 */
export interface AppContext {
  /** Whether the engine's tick loop is currently running. */
  readonly isRunning: boolean;
  /** Whether the tick loop is currently paused (no library's `__run` is called while paused). */
  readonly isPaused: boolean;
  /** Elapsed time in milliseconds since the last tick. Does not advance while paused. */
  readonly delta: number;
  /** Configured ticks-per-second for the run loop. */
  readonly tickRate: number;
  /** Requests that the tick loop stop after the current tick. */
  requestStop(): void;
  /** Pauses the tick loop: every library's `__run` is skipped until resumed. */
  requestPause(): void;
  /** Resumes a paused tick loop. */
  requestResume(): void;
}

/**
 * A typed, dev-editable key/value bag shared across all libraries and game
 * code for the lifetime of a run.
 *
 * @typeParam TVars - Shape of the variables bag. Defaults to an untyped
 * `Record<string, unknown>` when no shape is declared.
 */
export interface VarsContext<TVars extends Record<string, unknown> = Record<string, unknown>> {
  get<K extends keyof TVars>(key: K): TVars[K];
  set<K extends keyof TVars>(key: K, value: TVars[K]): void;
}

/**
 * Public surface of the engine's built-in asset library, always present on
 * `Context.assets` regardless of which libraries an app registers.
 */
export interface AssetContext {
  getAsset(path: string): NfFile;
  getAsset(path: "" | undefined): undefined;
}

/**
 * The context object handed to every library's `__run`/`__clear` hooks and
 * to game code.
 *
 * @remarks
 * `app`, `vars` and `assets` are always present (core-provided). Every other
 * key is contributed by a registered `Library` via its `expose()` method.
 * Library packages add their own key by augmenting this interface:
 *
 * ```ts
 * declare module "@nanoforge-dev/common" {
 *   interface Context {
 *     ecs: EcsContextApi;
 *   }
 * }
 * ```
 */
export interface Context {
  readonly app: AppContext;
  readonly vars: VarsContext;
  readonly assets: AssetContext;
}
