import { type InitContext } from "@nanoforge-dev/common";
import { AbstractECSLibrary } from "@nanoforge-dev/ecs-lib";

import { default as Module } from "../lib/libecs";

/**
 * Server-side ECS library backed by the compiled WASM module.
 *
 * @remarks
 * Loads `libecs.wasm` from the asset manager and initialises the entity
 * registry.  Register with the application:
 *
 * ```ts
 * server.useComponentSystem(new ECSServerLibrary());
 * ```
 *
 * Access the registry in game code:
 * ```ts
 * const ecs = ctx.libraries.getComponentSystem<ECSServerLibrary>().library;
 * const entity = ecs.registry.spawnEntity();
 * ```
 */
export class ECSServerLibrary extends AbstractECSLibrary {
  constructor() {
    super();
    this.path = "libecs.wasm";
  }

  /** @internal */
  get __name(): string {
    return "ECSLibrary";
  }

  /** @internal */
  override async __init(context: InitContext): Promise<void> {
    const wasmFile = context.libraries.getAssetManager().library.getAsset(this.path);
    this.module = await Module({ locateFile: () => wasmFile.path });
    this._registry = new this.module.Registry();
  }
}
