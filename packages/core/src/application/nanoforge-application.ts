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

export abstract class NanoforgeApplication {
  protected applicationConfig: ApplicationConfig;
  private _core: Core;

  constructor() {
    this.applicationConfig = new ApplicationConfig();
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
    await this._core.init(options);
  }

  public run() {
    this._core.run().then(() => {
      console.info("Game ended successfully.");
    });
  }
}
