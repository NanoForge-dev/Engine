import {
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type ILibrary,
  type INetworkLibrary,
  type IRunOptions,
} from "@nanoforge/common";
import { ApplicationContext } from "@nanoforge/common/src/context/contexts/application.context";

import { Core } from "../core/core";
import { ApplicationConfig } from "./application-config";

export abstract class NanoforgeApplication {
  protected applicationConfig: ApplicationConfig;

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

  public run(options: IRunOptions) {
    const core = new Core(this.applicationConfig, new ApplicationContext());
    core.run(options).then(() => {
      console.info("Game ended successfully.");
    });
  }
}
