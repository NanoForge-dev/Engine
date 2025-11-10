import {
  ASSET_MANAGER_LIBRARY,
  BaseComponentSystemLibrary,
  type Context,
  GRAPHICS_LIBRARY,
  type InitContext,
} from "@nanoforge/common";

import { type MainModule, Module, type Registry } from "../lib";

export class ECSLibrary extends BaseComponentSystemLibrary {
  private module?: MainModule;
  private _registry?: Registry;

  private readonly path: string = "libecs.wasm";

  constructor() {
    super({
      dependencies: [ASSET_MANAGER_LIBRARY],
      runAfter: [GRAPHICS_LIBRARY],
    });
  }

  get __name(): string {
    return "ECSLibrary";
  }

  async __init(context: InitContext): Promise<void> {
    const wasmFile = context.libraries.getAssetManager().library.getAsset(this.path);
    this.module = await Module({ locateFile: () => wasmFile.path });
    this._registry = new this.module.Registry();
  }

  async __run(ctx: Context): Promise<void> {
    if (!this._registry) this.throwNotInitializedError();
    this._registry.runSystems(ctx);
  }

  get registry(): Registry {
    if (!this._registry) this.throwNotInitializedError();
    return this._registry;
  }
}
