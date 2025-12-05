import {
  ASSET_MANAGER_LIBRARY,
  BaseComponentSystemLibrary,
  type Context,
  GRAPHICS_LIBRARY,
} from "@nanoforge-dev/common";

import { type MainModule, type Registry } from "../lib/libecs";

export abstract class AbstractECSLibrary extends BaseComponentSystemLibrary {
  protected module?: MainModule;
  protected _registry?: Registry;

  protected path!: string;

  protected constructor() {
    super({
      dependencies: [ASSET_MANAGER_LIBRARY],
      runAfter: [GRAPHICS_LIBRARY],
    });
  }

  abstract override get __name(): string;

  async __run(ctx: Context): Promise<void> {
    if (!this._registry) this.throwNotInitializedError();
    this._registry.runSystems(ctx);
  }

  get registry(): Registry {
    if (!this._registry) this.throwNotInitializedError();
    return this._registry;
  }
}
