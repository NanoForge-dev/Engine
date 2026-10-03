import type { AppContext, Library, TickObserver } from "@nanoforge-dev/common";

/**
 * The only place `app`'s state can be mutated.
 *
 * @remarks
 * Never exported from this package. `asAppContext()` returns a view backed
 * by live getters (not a snapshot), so `ctx.app.isRunning`/`.delta` reflect
 * current state across ticks without `Context` being rebuilt every frame.
 */
export class InternalAppState {
  private readonly _tickRate: number;
  private _isRunning = false;
  private _isPaused = false;
  private _delta = 0;
  private _stepRequested = false;
  private _keys: readonly string[] = [];
  private _libraries: readonly Library[] = [];
  private readonly _observers = new Set<TickObserver>();

  constructor(tickRate: number) {
    this._tickRate = tickRate;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  setIsRunning(value: boolean): void {
    this._isRunning = value;
  }

  setIsPaused(value: boolean): void {
    this._isPaused = value;
  }

  setDelta(value: number): void {
    this._delta = value;
  }

  /**
   * @param keys - Keys of the registered libraries.
   * @param ordered - The libraries in run order, for `callHook`.
   */
  setLibraries(keys: readonly string[], ordered: readonly Library[]): void {
    this._keys = keys;
    this._libraries = ordered;
  }

  /** Whether one tick was requested while paused (consumed). */
  takeStep(): boolean {
    const step = this._stepRequested;
    this._stepRequested = false;
    return step;
  }

  get observers(): ReadonlySet<TickObserver> {
    return this._observers;
  }

  asAppContext(): AppContext {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const state = this;
    return {
      get isRunning() {
        return state._isRunning;
      },
      get isPaused() {
        return state._isPaused;
      },
      get delta() {
        return state._delta;
      },
      get tickRate() {
        return state._tickRate;
      },
      requestStop: () => {
        state.setIsRunning(false);
      },
      requestPause: () => {
        state.setIsPaused(true);
      },
      requestResume: () => {
        state.setIsPaused(false);
      },
      requestStep: () => {
        state._stepRequested = true;
      },
      get libraries() {
        return state._keys;
      },
      callHook: async (name, ...args) => {
        for (const library of state._libraries) {
          const hook = (library as unknown as Record<string, unknown>)[name];
          if (typeof hook === "function") await hook.apply(library, args);
        }
      },
      observeTicks: (observer) => {
        state._observers.add(observer);
        return () => void state._observers.delete(observer);
      },
    };
  }
}
