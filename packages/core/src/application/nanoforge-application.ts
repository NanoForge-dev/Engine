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

export abstract class NanoforgeApplication {
  protected applicationConfig: ApplicationConfig;
  private _core?: Core;
  private readonly _options: IApplicationOptions;

  protected abstract get type(): "client" | "server";

  constructor(options?: Partial<IApplicationOptions>) {
    this.applicationConfig = new ApplicationConfig();

    this._options = {
      tickRate: 60,
      environment: {},
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

  public init(options: IRunOptions): Promise<void> {
    this._core = new Core(
      this.applicationConfig,
      new EditableApplicationContext(this.applicationConfig.libraryManager),
      this.type === "server",
    );
    return this._core.init(options, this._options);
  }

  public run() {
    if (!this._core) throw new NfNotInitializedException("Core");
    return this._core?.run();
  }
}
