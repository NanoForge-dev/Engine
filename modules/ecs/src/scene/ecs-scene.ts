import type { Context } from "@nanoforge-dev/common";
import { Scene, type SceneLoadContext } from "@nanoforge-dev/scene";

import type { Component, Entity, Registry, System } from "../../lib/web/libecs";
import "../shared/context-augmentation";
import { callSiteOf } from "../shared/editor-world";
import { removeSystemFunction, spawnFrom } from "../shared/registry-hooks";

interface SceneEntity {
  entity: Entity;
  components: Component[];
}

/**
 * A scene whose entities and systems are made in `setup`, and removed when it is unloaded.
 *
 * @remarks
 * Write `setup` like an app's `main`: `const x = registry.spawnEntity()`,
 * `registry.addComponent(x, new C(...))`, `registry.addSystem(fn)`. The registry it gets is the
 * app's, tracked: when the scene is unloaded, the systems added through it are removed, and the
 * entities spawned through it are killed. A component with a `destroy()` method gets it called
 * first (a component holding a graphics shape removes it from the screen).
 *
 * The editor edits `setup` the way it edits `main` (spawns written out, one per variable).
 *
 * @typeParam TParams - Shape of the params the scene expects.
 *
 * @example
 * ```ts
 * export class Level1 extends EcsScene {
 *   static override parent = Run;
 *
 *   override setup(registry: Registry, ctx: Context) {
 *     const wall = registry.spawnEntity();
 *     registry.addComponent(wall, new Position(40, 90));
 *     registry.addSystem(levelFlow);
 *   }
 * }
 * ```
 */
export abstract class EcsScene<TParams = undefined> extends Scene<TParams> {
  private readonly _entities: SceneEntity[] = [];
  private readonly _systems: System[] = [];

  /**
   * Makes the scene's entities and systems.
   *
   * @param _registry - The app's registry, tracked for this scene.
   * @param _ctx - The context given to `ctx.scenes.load`.
   * @param _scene - The scene's id and params.
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  public setup(
    _registry: Registry,
    _ctx: Context,
    _scene: SceneLoadContext<TParams>,
  ): void | Promise<void> {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Called when the scene is unloaded, before its entities and systems are removed.
   *
   * @param _registry - The app's registry.
   * @param _ctx - The context given to `ctx.scenes.load` or `ctx.scenes.unload`.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public teardown(_registry: Registry, _ctx: Context): void | Promise<void> {}

  public override async load(ctx: Context, scene: SceneLoadContext<TParams>): Promise<void> {
    await this.setup(this._track(ctx.ecs.registry, scene.id), ctx, scene);
  }

  public override async unload(ctx: Context): Promise<void> {
    const registry = ctx.ecs.registry;
    await this.teardown(registry, ctx);
    for (const system of this._systems.splice(0).reverse()) removeSystemFunction(registry, system);
    for (const { entity, components } of this._entities.splice(0)) {
      for (const component of components) {
        const destroy = (component as { destroy?: unknown }).destroy;
        if (typeof destroy === "function") destroy.call(component);
      }
      registry.killEntity(entity);
    }
  }

  /** The registry as `setup` sees it: what it spawns and adds is this scene's. */
  private _track(registry: Registry, id: string): Registry {
    const entities = this._entities;
    const systems = this._systems;
    const byId = new Map<number, SceneEntity>();
    const overrides: Partial<Registry> = {
      spawnEntity(): Entity {
        // The line of `setup` that asked, not this wrapper (0: "Error", 1: here, 2: the caller).
        const site = callSiteOf(new Error().stack);
        const entity = spawnFrom(registry, { ...(site && { site }), scene: id }, () =>
          registry.spawnEntity(),
        );
        const tracked = { entity, components: [] };
        entities.push(tracked);
        byId.set(entity.getId(), tracked);
        return entity;
      },
      addComponent(entity: Entity, component: Component) {
        byId.get(entity.getId())?.components.push(component);
        return registry.addComponent(entity, component);
      },
      addSystem(system: System): void {
        systems.push(system);
        registry.addSystem(system);
      },
    };
    return new Proxy(registry, {
      get(target, property, receiver) {
        if (property in overrides) return overrides[property as keyof Registry];
        const value = Reflect.get(target, property, receiver) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }
}
