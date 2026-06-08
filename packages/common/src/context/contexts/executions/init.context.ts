import { type IConfigRegistry, type LibraryManager } from "../../../library";
import { type IRunClientOptions, type IRunOptions } from "../../../options";
import { type ApplicationContext } from "../application.context";
import { BaseContext } from "./base.context";

/**
 * Context object passed to every library's `__init` lifecycle hook.
 *
 * @remarks
 * Provides libraries with all the information they need during start-up:
 * the canvas container, pre-loaded asset files, environment variables, and a
 * config registry for loading structured configuration classes.
 *
 * Access it in a library's `__init` override:
 * ```ts
 * override async __init(ctx: InitContext) {
 *   const config = await ctx.config.registerConfig(MyConfig);
 *   const file   = ctx.libraries.getAssetManager().library.getAsset("/data.json");
 * }
 * ```
 */
export class InitContext extends BaseContext {
  private readonly _container: IRunClientOptions["container"] | undefined;
  private readonly _files: IRunOptions["files"];
  private readonly _env: Record<string, string | undefined>;
  private readonly _config: IConfigRegistry;

  /**
   * @param context - Shared application-level runtime state.
   * @param libraryManager - Manager giving access to other registered libraries.
   * @param configRegistry - Registry used to resolve typed configuration objects.
   * @param options - Run options forwarded from NanoforgeApplication.init.
   */
  constructor(
    context: ApplicationContext,
    libraryManager: LibraryManager,
    configRegistry: IConfigRegistry,
    options: IRunOptions,
  ) {
    super(context, libraryManager);

    this._container = (options as IRunClientOptions)["container"];
    this._files = options.files;
    this._env = options.env;
    this._config = configRegistry;
  }

  /**
   * The `HTMLDivElement` that should host the game canvas.
   *
   * @remarks
   * Only available in client contexts; `undefined` on the server.
   */
  get container(): IRunClientOptions["container"] | undefined {
    return this._container;
  }

  /**
   * Map of virtual file paths to their URL strings, pre-loaded by the engine bundler.
   */
  get files(): IRunOptions["files"] {
    return this._files;
  }

  /**
   * Key/value map of environment variables made available at runtime.
   */
  get env(): Record<string, string | undefined> {
    return this._env;
  }

  /**
   * Registry that resolves class-validator/class-transformer decorated
   * configuration classes from the runtime environment.
   *
   * @remarks
   * Call `ctx.config.registerConfig(MyConfigClass)` to get a validated and
   * transformed instance populated from `ctx.env`.
   */
  get config(): IConfigRegistry {
    return this._config;
  }
}
