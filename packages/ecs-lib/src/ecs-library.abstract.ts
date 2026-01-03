import {
  ASSET_MANAGER_LIBRARY,
  BaseComponentSystemLibrary,
  type Context,
  GRAPHICS_LIBRARY,
} from "@nanoforge-dev/common";

import { type MainModule, type Registry } from "../lib/libecs";

/**
 * Abstract class representing an ECS (Entity Component System) library.
 * Extends the BaseComponentSystemLibrary to provide ECS-specific functionality.
 * Manages a registry of systems and ensures proper initialization before use.
 * @abstract
 * @class AbstractECSLibrary
 * @extends {BaseComponentSystemLibrary}
 */
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

  /**
   * Runs the ECS systems using the provided context.
   * @param ctx - The context to be used for running the systems.
   * @returns A promise that resolves when the systems have been run.
   */
  async __run(ctx: Context): Promise<void> {
    if (!this._registry) this.throwNotInitializedError();
    this._registry.runSystems(ctx);
  }

  /**
   * Gets the registry.
   * @throws Will throw an error if the library is not initialized.
   * @returns The registry.
   */
  get registry(): Registry {
    if (!this._registry) this.throwNotInitializedError();
    return this._registry;
  }
}
