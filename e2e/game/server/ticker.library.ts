import { BaseNetworkLibrary, type Context } from "@nanoforge-dev/common";

/**
 * A runner library that stops the game loop after a fixed number of ticks.
 * Reuses BaseNetworkLibrary (no abstract methods) so it can be registered
 * as a standard library. Exposes `done` which resolves when the game stops.
 */
export class TickerLibrary extends BaseNetworkLibrary {
  private _remaining: number;
  private _resolve!: () => void;

  public readonly done: Promise<void> = new Promise<void>((resolve) => {
    this._resolve = resolve;
  });

  constructor(ticks: number) {
    super();
    this._remaining = ticks;
  }

  get __name(): string {
    return "TickerLibrary";
  }

  async __run(ctx: Context): Promise<void> {
    this._remaining--;
    if (this._remaining <= 0) {
      ctx.app.setIsRunning(false);
      this._resolve();
    }
  }
}
