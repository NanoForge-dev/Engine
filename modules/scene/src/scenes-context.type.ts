import type { Context } from "@nanoforge-dev/common";

import type { LoadOptions, Scene, SceneClass } from "./scene";
import type { SceneVarsApi } from "./scene-vars";

/** Public surface of `SceneLibrary`, exposed on `Context.scenes`. */
export interface ScenesContextApi {
  /** The scene loaded deepest, if any. */
  readonly current: Scene<never> | undefined;
  /** The loaded scenes, root first. */
  readonly loaded: readonly Scene<never>[];
  /** Vars shared by scenes and systems. */
  readonly vars: SceneVarsApi;
  /**
   * Moves to a scene: unloads the loaded scenes up to the deepest one it
   * shares with `scene`'s parents, then loads its missing parents and the
   * scene itself.
   *
   * @remarks
   * The change is queued and made when no system runs (see `SceneLibrary`).
   * A scene already loaded is not loaded again: the scenes under it are
   * unloaded.
   *
   * @param ctx - Handed to the `load` and `unload` of the scenes.
   * @param scene - The scene to move to.
   * @param options - Its params, and the parent to load it under.
   * @returns A promise resolved once the change is made.
   * @throws `NfSceneCycleException` (through the promise) When a scene ends up among its own parents.
   */
  load<TParams>(
    ctx: Context,
    scene: SceneClass<TParams>,
    options?: LoadOptions<TParams>,
  ): Promise<void>;
  /**
   * Unloads a scene and the scenes loaded under it: a move to its parent.
   * Nothing happens when it is not loaded.
   *
   * @param ctx - Handed to the `unload` of the scenes.
   * @returns A promise resolved once the change is made.
   */
  unload(ctx: Context, scene: SceneClass): Promise<void>;
  /** Whether a scene of this class is loaded. */
  isLoaded(scene: SceneClass): boolean;
}
