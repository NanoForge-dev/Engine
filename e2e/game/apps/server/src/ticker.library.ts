import { type Context, defineLibraryKey, Library } from "@nanoforge-dev/common";

declare module "@nanoforge-dev/common" {
  interface Context {
    ticker: unknown;
  }
}

/**
 * Stops the game loop after a fixed number of ticks.
 * Exposes `done`, which resolves once the loop has stopped.
 */
export class TickerLibrary extends Library {
  readonly key = defineLibraryKey("ticker");

  private _remaining: number;
  private _resolve!: () => void;

  public readonly done: Promise<void> = new Promise<void>((resolve) => {
    this._resolve = resolve;
  });

  constructor(ticks: number) {
    super();
    this._remaining = ticks;
  }

  public override async __run(ctx: Context): Promise<void> {
    this._remaining--;
    if (this._remaining <= 0) {
      ctx.app.requestStop();
      this._resolve();
    }
  }
}
