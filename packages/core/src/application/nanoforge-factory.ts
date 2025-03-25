import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { InputLibrary } from "@nanoforge/input";

import { type IApplicationOptions } from "./application-options.type";
import { NanoforgeClient } from "./nanoforge-client";
import { NanoforgeServer } from "./nanoforge-server";

class NanoforgeFactoryStatic {
  createClient(options?: Partial<IApplicationOptions>): NanoforgeClient {
    const app = new NanoforgeClient(options);
    app.useAssetManager(new AssetManagerLibrary());
    app.useInput(new InputLibrary());
    return app;
  }

  createServer(options?: Partial<IApplicationOptions>): NanoforgeServer {
    const app = new NanoforgeServer(options);
    app.useAssetManager(new AssetManagerLibrary());
    return app;
  }
}

export const NanoforgeFactory = new NanoforgeFactoryStatic();
