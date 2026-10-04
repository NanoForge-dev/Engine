import type { Context } from "@nanoforge-dev/common";

/**
 * What a scene's `load` receives besides the engine context.
 *
 * @typeParam TParams - Shape of the params the scene expects.
 */
export interface SceneLoadContext<TParams = undefined> {
  /** The scene's id: its key in `SceneLibrary`'s `scenes`, else its class name. */
  readonly id: string;
  /**
   * The params given to `ctx.scenes.load`. `undefined` when the scene is
   * loaded as the parent of the scene that was asked for.
   */
  readonly params: TParams | undefined;
}

/**
 * A scene class, as given to `ctx.scenes.load`.
 *
 * @typeParam TParams - Shape of the params the scene expects.
 */
export interface SceneClass<TParams = unknown> {
  /** The scene this one is loaded under (see `Scene.parent`). */
  readonly parent?: SceneClass<never> | undefined;
  readonly name: string;
  new (): Scene<TParams>;
}

/**
 * Base class of every scene.
 *
 * @remarks
 * A scene is loaded and unloaded through `ctx.scenes`. Each load creates a
 * new instance, dropped after its unload: keep what the scene creates
 * (entities, systems…) in its fields, and remove it in `unload`.
 *
 * Scenes form a tree: a scene names the scene it is loaded under with a
 * static `parent`. Loading a scene first loads its parents that are not
 * loaded yet. Only one chain of scenes is loaded at a time, from a root
 * scene to the current one.
 *
 * Document a scene for the editor like components and systems: a TSDoc
 * comment with the `@scene` tag, `@side` (`client`, `server` or `shared`)
 * and `@vars` (the vars it inits or reads). Its parent is read from
 * `static parent`, its params from the type argument.
 *
 * @typeParam TParams - Shape of the params the scene expects in `load`.
 *
 * @example
 * ```ts
 * /**
 *  * First level: the player and the walls.
 *  *
 *  * @scene
 *  * @side client
 *  * @vars score
 *  *\/
 * export class Level1 extends Scene<{ seed: number }> {
 *   static override parent = Game;
 *   private _player?: Entity;
 *
 *   override load(ctx: Context, { params }: SceneLoadContext<{ seed: number }>) {
 *     this._player = ctx.ecs.registry.spawnEntity();
 *     ctx.scenes.vars.init("score", 0);
 *   }
 *
 *   override unload(ctx: Context) {
 *     ctx.ecs.registry.killEntity(this._player!);
 *   }
 * }
 * ```
 */
export abstract class Scene<TParams = undefined> {
  /**
   * The scene this one is loaded under, if any.
   *
   * @remarks
   * `ctx.scenes.load(ctx, Scene, { parent })` loads a scene under another
   * parent for that load (a pause menu shown on any scene).
   */
  static readonly parent?: SceneClass<never> | undefined;

  /**
   * Called when the scene is loaded, after its parents.
   *
   * @param _ctx - The context given to `ctx.scenes.load`.
   * @param _scene - The params of the load.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public load(_ctx: Context, _scene: SceneLoadContext<TParams>): void | Promise<void> {}

  /**
   * Called when the scene is unloaded, after the scenes loaded under it.
   * The vars it owns are removed right after.
   *
   * @param _ctx - The context given to `ctx.scenes.load` or `ctx.scenes.unload`.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public unload(_ctx: Context): void | Promise<void> {}
}

/**
 * Options of `ctx.scenes.load`.
 *
 * @typeParam TParams - Shape of the params the scene expects.
 */
export interface LoadOptions<TParams = unknown> {
  /** Handed to the scene's `load`. */
  params?: TParams;
  /**
   * Loads the scene under this parent instead of its static `parent`:
   * a scene class, or `"current"` for the scene loaded deepest.
   */
  parent?: SceneClass<never> | "current";
}
