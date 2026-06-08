import {
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type ILibrary,
  type INetworkLibrary,
  type IRunOptions,
  NfNotInitializedException,
} from "@nanoforge-dev/common";

import { EditableApplicationContext } from "../common/context/contexts/application.editable-context";
import { Core } from "../core/core";
import { ApplicationConfig } from "./application-config";
import type { IApplicationOptions } from "./application-options.type";

/**
 * Base class for client and server NanoForge applications.
 *
 * @remarks
 * Do not instantiate directly — use `NanoforgeFactory.createClient` or
 * `NanoforgeFactory.createServer` to get a fully configured instance of
 * `NanoforgeClient` or `NanoforgeServer`.
 *
 * @example
 * ```ts
 * const client = NanoforgeFactory.createClient(`tickRate: 30 `);
 * client.useAssetManager(new AssetManagerLibrary());
 * client.useGraphics(new Graphics2DLibrary());
 * await client.init(`container, files, env `);
 * client.run();
 * ```
 */
export abstract class NanoforgeApplication {
  protected applicationConfig: ApplicationConfig;
  private _core?: Core;
  private readonly _options: IApplicationOptions;

  /**
   * @param options - Optional application-level settings such as tickRate.
   */
  constructor(options?: Partial<IApplicationOptions>) {
    this.applicationConfig = new ApplicationConfig();

    this._options = {
      tickRate: 60,
      ...(options ?? {}),
    };
  }

  /**
   * Register a library under a custom symbol.
   *
   * @remarks
   * Use this method for libraries that do not have a dedicated shorthand (e.g.
   * game-specific custom libraries).  For built-in library types prefer the
   * typed helpers such as `useAssetManager`, `useNetwork`, etc.
   *
   * @param sym - Unique symbol identifying the library slot.
   * @param library - Library instance to register.
   */
  public use(sym: symbol, library: ILibrary): void {
    this.applicationConfig.useLibrary(sym, library);
  }

  /**
   * Register the component-system (ECS) library.
   *
   * @param library - ECS library instance (e.g. ECSClientLibrary or ECSServerLibrary).
   */
  public useComponentSystem(library: IComponentSystemLibrary) {
    this.applicationConfig.useComponentSystemLibrary(library);
  }

  /**
   * Register the network library.
   *
   * @param library - Network library instance (e.g. NetworkClientLibrary or NetworkServerLibrary).
   */
  public useNetwork(library: INetworkLibrary) {
    this.applicationConfig.useNetworkLibrary(library);
  }

  /**
   * Register the asset-manager library.
   *
   * @param library - Asset manager instance (e.g. AssetManagerLibrary).
   */
  public useAssetManager(library: IAssetManagerLibrary) {
    this.applicationConfig.useAssetManagerLibrary(library);
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
  public init(options: IRunOptions): Promise<void> {
    this._core = new Core(
      this.applicationConfig,
      new EditableApplicationContext(this.applicationConfig.libraryManager),
    );
    return this._core.init(options, this._options);
  }

  /**
   * Start the game loop.
   *
   * @remarks
   * Must be called after `init` has resolved.
   *
   * @throws `NfNotInitializedException` When called before `init`.
   */
  public run() {
    if (!this._core) throw new NfNotInitializedException("Core");
    return this._core?.run();
  }
}
