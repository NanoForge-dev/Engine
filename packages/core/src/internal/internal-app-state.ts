import type { AppContext } from "@nanoforge-dev/common";

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
    };
  }
}
