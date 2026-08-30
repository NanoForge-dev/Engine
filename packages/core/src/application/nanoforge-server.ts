import type { RunOptions } from "@nanoforge-dev/common";

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
  public async init(options: RunOptions): Promise<void> {
    await this.initialize(options);
  }
}
