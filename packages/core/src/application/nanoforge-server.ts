import type { ServerRunOptions } from "@nanoforge-dev/common";

import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Server-side NanoForge application.
 *
 * @remarks
 * Extends `NanoforgeApplication` for use in Node.js server processes.
 * Create an instance via `NanoforgeFactory.createServer`.
 *
 * @example
 * ```ts
 * const server = NanoforgeFactory.createServer();
 * server.use(new NetworkServerLibrary());
 * server.use(new EcsLibrary());
 * await server.init(`files, env `);
 * server.run();
 * ```
 */
export class NanoforgeServer extends NanoforgeApplication {
  private _clock?: Worker;

  /**
   * Initialise all registered libraries in dependency order and prepare the
   * engine for the game loop.
   *
   * @remarks
   * Must be called before `run`.  Resolves once every library's `__init`
   * hook has completed.
   *
   * @param options - Run options providing the canvas container, files map, and
   *   environment variables.
   */
  public async init(options: ServerRunOptions): Promise<void> {
    await this.initialize(options);
  }

  /**
   * In a browser (a peer-to-peer host), ticks are timed by a worker: the
   * timers of a hidden tab are throttled, which would slow the game down for
   * every player.
   */
  protected override schedule(tick: () => void, delayMs: number): void {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      super.schedule(tick, delayMs);
      return;
    }
    const source = "onmessage = (event) => setTimeout(() => postMessage(0), event.data);";
    this._clock ??= new Worker(
      URL.createObjectURL(new Blob([source], { type: "text/javascript" })),
    );
    this._clock.onmessage = () => tick();
    this._clock.postMessage(Math.max(0, delayMs));
  }
}
