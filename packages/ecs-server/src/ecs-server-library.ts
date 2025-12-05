import { type InitContext } from "@nanoforge-dev/common";
import { AbstractECSLibrary } from "@nanoforge-dev/ecs";

import { default as Module } from "../lib/libecs";

export class ECSServerLibrary extends AbstractECSLibrary {
  constructor() {
    super();
    this.path = "libecs.wasm";
  }

  get __name(): string {
    return "ECSLibrary";
  }

  override async __init(context: InitContext): Promise<void> {
    const wasmFile = context.libraries.getAssetManager().library.getAsset(this.path);
    this.module = await Module({ locateFile: () => wasmFile.path });
    this._registry = new this.module.Registry();
  }
}
