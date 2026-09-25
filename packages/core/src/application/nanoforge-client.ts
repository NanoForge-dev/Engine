import type { ClientRunOptions } from "@nanoforge-dev/common";

import { InternalViewportState } from "../internal/internal-viewport-state";
import type { ClientApplicationOptions } from "./application-options.type";
import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Client-side NanoForge application.
 *
 * @remarks
 * Extends `NanoforgeApplication` with client-specific library slots for
 * graphics, input, and sound, and owns the `viewport` (design resolution,
 * fit mode and window-resize tracking) exposed on `Context.viewport`.
 * Create an instance via `NanoforgeFactory.createClient`.
 *
 * @example
 * ```ts
 * const client = NanoforgeFactory.createClient({
 *   viewport: { width: 1920, height: 1080, fit: "contain" },
 * });
 * client.use(new Graphics2DLibrary());
 * client.use(new InputLibrary());
 * client.use(new SoundLibrary());
 * await client.init(`container, files, env `);
 * client.run();
 * ```
 */
export class NanoforgeClient extends NanoforgeApplication {
  private readonly viewportOptions: ClientApplicationOptions["viewport"];

  /**
   * @param options - Optional application settings such as tickRate and viewport.
   */
  constructor(options?: Partial<ClientApplicationOptions>) {
    const { viewport, ...applicationOptions } = options ?? {};
    super(applicationOptions);
    this.viewportOptions = viewport;
  }

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
    this.viewport = new InternalViewportState(options.container, this.viewportOptions);
    await this.initialize(options);
  }
}
