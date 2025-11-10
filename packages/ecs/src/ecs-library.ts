import {
  ASSET_MANAGER_LIBRARY,
  BaseComponentSystemLibrary,
  type Context,
  GRAPHICS_LIBRARY,
  type InitContext,
} from "@nanoforge/common";

import { type MainModule, Module } from "../lib";
import { ECSRegistry } from "./ecs-registry";

export class ECSLibrary extends BaseComponentSystemLibrary {
  private module: MainModule;
  private _registry: ECSRegistry;

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
    this._registry = new ECSRegistry(new this.module.Registry());
  }

  async __run(ctx: Context): Promise<void> {
    this._registry.runSystems(ctx);
  }

  get registry(): ECSRegistry {
    return this._registry;
  }
}
