import {
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type ILibrary,
  type INetworkLibrary,
  type IRunOptions,
  NfNotInitializedException,
} from "@nanoforge-dev/common";

import { ApplicationConfig } from "../../../core/src/application/application-config";
import type { IApplicationOptions } from "../../../core/src/application/application-options.type";
import { EditableApplicationContext } from "../../../core/src/common/context/contexts/application.editable-context";
import { Core } from "../core/core";

/**
 * Base class for editor-mode NanoForge applications.
 *
 * @remarks
 * Mirror of `NanoforgeApplication` from `@nanoforge-dev/core` with an
 * extended `init` signature that accepts `IEditorRunOptions`.  Use
 * `NanoforgeFactory` from this package to create instances.
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
   * @param sym - Unique symbol identifying the library slot.
   * @param library - Library instance to register.
   */
  public use(sym: symbol, library: ILibrary): void {
    this.applicationConfig.useLibrary(sym, library);
  }

  /**
   * Register the component-system (ECS) library.
   *
   * @param library - ECS library instance.
   */
  public useComponentSystem(library: IComponentSystemLibrary) {
    this.applicationConfig.useComponentSystemLibrary(library);
  }

  /**
   * Register the network library.
   *
   * @param library - Network library instance.
   */
  public useNetwork(library: INetworkLibrary) {
    this.applicationConfig.useNetworkLibrary(library);
  }

  /**
   * Register the asset-manager library.
   *
   * @param library - Asset manager instance.
   */
  public useAssetManager(library: IAssetManagerLibrary) {
    this.applicationConfig.useAssetManagerLibrary(library);
  }

  /**
   * Initialise all registered libraries and prepare the engine for the game loop.
   *
   * @param options - Editor run options including save/events callbacks and canvas container.
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
   * @throws `NfNotInitializedException` When called before `init`.
   */
  public run() {
    if (!this._core) throw new NfNotInitializedException("Core");
    return this._core?.run();
  }
}
