import type { ClientRunOptions } from "@nanoforge-dev/common";

import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Client-side NanoForge application.
 *
 * @remarks
 * Extends `NanoforgeApplication` with client-specific library slots for
 * graphics, input, and sound.  Create an instance via
 * `NanoforgeFactory.createClient`.
 *
 * @example
 * ```ts
 * const client = NanoforgeFactory.createClient();
 * client.use(new Graphics2DLibrary());
 * client.use(new InputLibrary());
 * client.use(new SoundLibrary());
 * await client.init(`container, files, env `);
 * client.run();
 * ```
 */
export class NanoforgeClient extends NanoforgeApplication {
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
  public async init(options: ClientRunOptions): Promise<void> {
    await this.initialize(options);
  }
}
