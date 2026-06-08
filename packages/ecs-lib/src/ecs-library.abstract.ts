import {
  ASSET_MANAGER_LIBRARY,
  BaseComponentSystemLibrary,
  type Context,
  GRAPHICS_LIBRARY,
} from "@nanoforge-dev/common";

import { type MainModule, type Registry } from "../lib/libecs";

/**
 * Abstract base class for WASM-backed ECS (Entity Component System) libraries.
 *
 * @remarks
 * Loads a compiled `libecs.wasm` binary via the asset manager and initialises
 * a `Registry` from the resulting module.  Concrete subclasses only need to
 * set `this.path` (the asset path to the `.wasm` file) and call `super()`
 * — see `ECSClientLibrary` and `ECSServerLibrary`.
 *
 * Requires the `ASSET_MANAGER_LIBRARY` dependency and runs after
 * `GRAPHICS_LIBRARY`.
 *
 * @example
 * ```ts
 * // Inside a system's __run hook:
 * const ecs = ctx.libraries.getComponentSystem<ECSClientLibrary>().library;
 * const player = ecs.registry.spawnEntity();
 * ecs.registry.addComponent(player, new PositionComponent(0, 0));
 * ```
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

  /** @internal */
  abstract override get __name(): string;

  /** @internal */
  async __run(ctx: Context): Promise<void> {
    if (!this._registry) this.throwNotInitializedError();
    this._registry.runSystems(ctx);
  }

  /**
   * The WASM-backed entity/component registry.
   *
   * @remarks
   * Use this to spawn entities, register components, add systems, and query
   * component data.
   *
   * @throws `NfNotInitializedException` When accessed before `__init` has resolved.
   */
  get registry(): Registry {
    if (!this._registry) this.throwNotInitializedError();
    return this._registry;
  }
}
