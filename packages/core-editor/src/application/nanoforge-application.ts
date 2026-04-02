import {
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type ILibrary,
  type INetworkLibrary,
  NfNotInitializedException,
} from "@nanoforge-dev/common";

import { ApplicationConfig } from "../../../core/src/application/application-config";
import type { IApplicationOptions } from "../../../core/src/application/application-options.type";
import { EditableApplicationContext } from "../../../core/src/common/context/contexts/application.editable-context";
import { type IEditorRunOptions } from "../common/context/options.type";
import { Core } from "../core/core";

export abstract class NanoforgeApplication {
  protected applicationConfig: ApplicationConfig;
  private _core?: Core;
  private readonly _options: IApplicationOptions;

  constructor(options?: Partial<IApplicationOptions>) {
    this.applicationConfig = new ApplicationConfig();

    this._options = {
      tickRate: 60,
      ...(options ?? {}),
    };
  }

  public use(sym: symbol, library: ILibrary): void {
    this.applicationConfig.useLibrary(sym, library);
  }

  public useComponentSystem(library: IComponentSystemLibrary) {
    this.applicationConfig.useComponentSystemLibrary(library);
  }

  public useNetwork(library: INetworkLibrary) {
    this.applicationConfig.useNetworkLibrary(library);
  }

  public useAssetManager(library: IAssetManagerLibrary) {
    this.applicationConfig.useAssetManagerLibrary(library);
  }

  public init(options: IEditorRunOptions): Promise<void> {
    this._core = new Core(
      this.applicationConfig,
      new EditableApplicationContext(this.applicationConfig.libraryManager),
    );
    return this._core.init(options, this._options);
  }

  public run() {
    if (!this._core) throw new NfNotInitializedException("Core");
    return this._core?.run();
  }
}
