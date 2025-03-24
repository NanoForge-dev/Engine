import {
  ApplicationContext,
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type ILibrary,
  type INetworkLibrary,
  type IRunOptions,
} from "@nanoforge/common";

import { Core } from "../core/core";
import { ApplicationConfig } from "./application-config";
import type { IApplicationOptions } from "./application-options.type";

export abstract class NanoforgeApplication {
  protected applicationConfig: ApplicationConfig;
  private _core: Core;
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

  public async init(options: IRunOptions): Promise<void> {
    this._core = new Core(this.applicationConfig, new ApplicationContext());
    await this._core.init(options, this._options);
  }

  public run() {
    this._core.run();
  }
}
