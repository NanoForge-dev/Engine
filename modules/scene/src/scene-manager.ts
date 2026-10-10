import type { Context } from "@nanoforge-dev/common";

import type { LoadOptions, Scene, SceneClass } from "./scene";
import { planMove, resolvePath } from "./scene-path";
import { SceneVarsStore } from "./scene-vars";

type AnySceneClass = SceneClass<never>;
type AnyScene = Scene<never>;

interface LoadedScene {
  id: string;
  type: AnySceneClass;
  scene: AnyScene;
  params: unknown;
}

/** A loaded scene, as `SceneManager.chain` lists it. */
export interface LoadedSceneInfo {
  readonly id: string;
  readonly params: unknown;
}

type SceneChange =
  /** A move to `target`. */
  | { kind: "load"; target: AnySceneClass; options: LoadOptions | undefined }
  /** The unload of `target` and of the scenes under it. */
  | { kind: "unload"; target: AnySceneClass };

type SceneRequest = SceneChange & {
  ctx: Context | undefined;
  resolve: () => void;
  reject: (error: unknown) => void;
};

/**
 * Loads and unloads scenes, and keeps the scene vars.
 *
 * @remarks
 * `load` and `unload` only queue a change; `apply` makes the queued changes,
 * one after the other, at a time no system runs.
 */
export class SceneManager {
  readonly vars = new SceneVarsStore(() => this._active ?? this.current);

  private _loaded: LoadedScene[] = [];
  private _queue: SceneRequest[] = [];
  /** The scene whose `load` or `unload` runs. */
  private _active: AnyScene | undefined;
  private readonly _ids = new Map<AnySceneClass, string>();
  private readonly _byId = new Map<string, AnySceneClass>();

  /**
   * @param scenes - The game's scene classes by id. A scene missing from it is known by its
   * class name.
   */
  constructor(scenes: Readonly<Record<string, SceneClass<never>>> = {}) {
    for (const [id, type] of Object.entries(scenes)) {
      this._ids.set(type, id);
      this._byId.set(id, type);
    }
  }

  /** A scene class's id: its key in the `scenes` given, else its class name. */
  idOf(type: SceneClass<never>): string {
    return this._ids.get(type) ?? type.name;
  }

  /** The scene class of an id: from the `scenes` given, else a scene class seen so far. */
  byId(id: string): SceneClass<never> | undefined {
    return this._byId.get(id);
  }

  /** Ids of the scenes that can be loaded by id. */
  get knownIds(): string[] {
    return [...this._byId.keys()];
  }

  /** The loaded scenes' ids and params, root first. */
  get chain(): LoadedSceneInfo[] {
    return this._loaded.map(({ id, params }) => ({ id, params }));
  }

  /** The id of a loaded scene instance. */
  idOfScene(scene: Scene<never>): string | undefined {
    return this._loaded.find((loaded) => loaded.scene === scene)?.id;
  }

  /** The scene loaded deepest. */
  get current(): AnyScene | undefined {
    return this._loaded.at(-1)?.scene;
  }

  /** The loaded scenes, root first. */
  get loaded(): AnyScene[] {
    return this._loaded.map(({ scene }) => scene);
  }

  isLoaded(type: SceneClass): boolean {
    return this._loaded.some((loaded) => loaded.type === type);
  }

  /**
   * Queues a move to `type`.
   *
   * @returns A promise resolved once the move is made, rejected if it fails.
   */
  load<TParams>(
    ctx: Context | undefined,
    type: SceneClass<TParams>,
    options?: LoadOptions<TParams>,
  ): Promise<void> {
    return this._request(
      { kind: "load", target: type as AnySceneClass, options: options as LoadOptions | undefined },
      ctx,
    );
  }

  /**
   * Queues the unload of `type` and of the scenes loaded under it. Nothing
   * happens when it is not loaded by then.
   */
  unload(ctx: Context | undefined, type: SceneClass): Promise<void> {
    return this._request({ kind: "unload", target: type as AnySceneClass }, ctx);
  }

  /**
   * Makes the queued changes, including those queued by the scenes' hooks.
   *
   * @param ctx - Handed to the hooks of a change queued without a context.
   * @throws The first error of a hook or of a move: that request's promise is rejected too.
   */
  async apply(ctx: Context): Promise<void> {
    let request: SceneRequest | undefined;
    while ((request = this._queue.shift())) {
      try {
        await this._move(request, request.ctx ?? ctx);
      } catch (error) {
        request.reject(error);
        throw error;
      }
      request.resolve();
    }
  }

  /** Drops the loaded scenes and the vars, without calling the hooks. */
  reset(): void {
    const stopped = new Error("[NANOFORGE] Scene - The game stopped.");
    for (const request of this._queue.splice(0)) request.reject(stopped);
    this._loaded = [];
    this._active = undefined;
    this.vars.clear();
  }

  private _request(change: SceneChange, ctx: Context | undefined): Promise<void> {
    let resolve!: () => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // The error also stops `apply`: a caller that doesn't wait must not get an unhandled rejection.
    promise.catch(() => {});
    this._queue.push({ ...change, ctx, resolve, reject });
    return promise;
  }

  private async _move(request: SceneRequest, ctx: Context): Promise<void> {
    const loadedTypes = this._loaded.map(({ type }) => type);
    let path: AnySceneClass[];
    if (request.kind === "unload") {
      const index = loadedTypes.indexOf(request.target);
      if (index < 0) return;
      path = loadedTypes.slice(0, index);
    } else {
      const parent = request.options?.parent;
      path = resolvePath(
        request.target,
        parent === "current" ? this._currentParent(request.target) : parent,
        loadedTypes,
      );
    }

    const plan = planMove(loadedTypes, path);
    // The scenes to unload are the end of the loaded chain, deepest first.
    const leaving = this._loaded.slice(this._loaded.length - plan.unload.length).reverse();
    for (const { scene } of leaving) {
      await this._run(scene, () => scene.unload(ctx));
      this._loaded.pop();
      this.vars.removeOwnedBy(scene);
    }
    for (const type of plan.load) {
      const scene = new type();
      const params =
        request.kind === "load" && type === request.target ? request.options?.params : undefined;
      const id = this.idOf(type);
      // Known from now on, so the editor can load it by id.
      if (!this._byId.has(id)) this._byId.set(id, type);
      try {
        await this._run(scene, () => scene.load(ctx, { id, params: params as never }));
      } catch (error) {
        this.vars.removeOwnedBy(scene);
        throw error;
      }
      this._loaded.push({ id, type, scene, params });
    }
  }

  /** The scene loaded deepest, other than `target` itself. */
  private _currentParent(target: AnySceneClass): AnySceneClass | undefined {
    const last = this._loaded.at(-1);
    if (last?.type !== target) return last?.type;
    return this._loaded.at(-2)?.type;
  }

  private async _run(scene: AnyScene, hook: () => void | Promise<void>): Promise<void> {
    const previous = this._active;
    this._active = scene;
    try {
      await hook();
    } finally {
      this._active = previous;
    }
  }
}
