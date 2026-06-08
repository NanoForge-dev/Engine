/**
 * Union of client and server run options accepted by
 * `NanoforgeApplication.init`.
 */
export type IRunOptions = IRunClientOptions | IRunServerOptions;

/**
 * Run options for a client-side NanoForge application.
 *
 * @remarks
 * Pass an instance to `NanoforgeApplication.init` when running in the
 * browser.  The engine bundler (`nf build`) automatically generates and
 * injects `files` and `env` at build time.
 */
export interface IRunClientOptions {
  /**
   * DOM element that will host the game canvas.
   *
   * @remarks
   * The element's current `offsetWidth` and `offsetHeight` are used to set
   * the initial canvas dimensions.
   */
  container: HTMLDivElement;

  /**
   * Map of virtual file paths to their resolved URL strings.
   *
   * @remarks
   * Populated automatically by the NanoForge bundler.  Keys are normalised
   * paths such as `"/textures/hero.png"`.
   */
  files: Map<string, string>;

  /**
   * Runtime environment variables available to all libraries via
   * `InitContext.env`.
   */
  env: Record<string, string | undefined>;
}

/**
 * Run options for a server-side NanoForge application.
 *
 * @remarks
 * Pass an instance to `NanoforgeApplication.init` when running in a
 * Node.js server process.
 */
export interface IRunServerOptions {
  /**
   * Map of virtual file paths to their resolved URL strings.
   *
   * @remarks
   * Populated automatically by the NanoForge bundler.  Keys are normalised
   * paths such as `"/data/config.json"`.
   */
  files: Map<string, string>;

  /**
   * Runtime environment variables available to all libraries via
   * `InitContext.env`.
   */
  env: Record<string, string | undefined>;
}
