/**
 * Holds runtime state that is shared across all libraries during the game loop.
 *
 * @remarks
 * An instance of this class is available to every library via
 * `BaseContext.application`.  Libraries may read `isRunning` and `delta`
 * to make frame-rate-independent decisions.
 */
export abstract class ApplicationContext {
  private _isRunning: boolean = false;
  /** @internal */
  protected _delta!: number;

  /**
   * Whether the engine game loop is currently executing.
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Elapsed time in milliseconds since the last frame.
   */
  get delta(): number {
    return this._delta;
  }

  /** @internal */
  setIsRunning(value: boolean): void {
    this._isRunning = value;
  }

  /** @internal */
  abstract muteSoundLibraries(): void;
}
