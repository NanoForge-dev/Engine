import { type Context, Library, defineLibraryKey } from "@nanoforge-dev/common";
import type {
  EditorAwareLibrary,
  EditorContextApi,
  EditorInitContext,
} from "@nanoforge-dev/editor-lib";

import "./context-augmentation";
import type { EditorScenes } from "./editor-scenes";
import { toEditorValue } from "./editor-value";
import type { SceneClass } from "./scene";
import { SceneManager } from "./scene-manager";
import type { ScenesContextApi } from "./scenes-context.type";

/** Options of `SceneLibrary`. */
export interface SceneLibraryOptions<TParams = unknown> {
  /** The scene loaded at the start of the first tick. */
  initial?: SceneClass<TParams>;
  /** Params of the initial scene. */
  params?: TParams;
  /**
   * Every scene class of the game, by id: `{ Menu, Level1 }`. The ids name the scenes for the
   * editor (and survive a bundler renaming a class), and let it load any of them while the game
   * runs. A scene missing from it is known by its class name.
   */
  scenes?: Readonly<Record<string, SceneClass<never>>>;
}

/**
 * The scene manager, exposed on `Context.scenes`.
 *
 * @remarks
 * Scene changes asked through `ctx.scenes` are queued, and made when no
 * system runs: before the tick's systems (for changes asked outside of
 * them, such as before `app.run()`) and right after them. The library runs
 * after every other one for that.
 *
 * When the game stops, the loaded scenes and the vars are dropped without
 * calling `unload`: the other libraries are cleared by then.
 *
 * @example
 * ```ts
 * app.use(new SceneLibrary({ initial: MainMenu }));
 *
 * // in a system
 * if (start) ctx.scenes.load(ctx, Level1, { params: { seed: 3 } });
 * ```
 */
export class SceneLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("scenes");

  private _manager?: SceneManager;
  private _editor?: EditorContextApi;
  private _lastSent = 0;
  private _lastJson = "";

  constructor(private readonly _options: SceneLibraryOptions = {}) {
    super({ runBefore: ["*"] });
  }

  public override async __init(): Promise<void> {
    this._manager = new SceneManager(this._options.scenes);
    if (this._options.initial) {
      void this._manager.load(undefined, this._options.initial, { params: this._options.params });
    }
  }

  /** Listens to the editor's scene commands (live mode). */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    this._editor = ctx.editor;
    const manager = this.manager;
    const scene = (id: string) => {
      const type = manager.byId(id);
      if (!type) console.warn(`[NANOFORGE] Scene - no scene "${id}" to load.`);
      return type;
    };
    ctx.editor.on("scenes-load", (id, params, parent) => {
      const type = scene(id);
      const under = parent === "current" ? "current" : parent ? scene(parent) : undefined;
      if (type) void manager.load(undefined, type, { params, ...(under && { parent: under }) });
    });
    ctx.editor.on("scenes-unload", (id) => {
      const type = scene(id);
      if (type) void manager.unload(undefined, type);
    });
    ctx.editor.on("scenes-set-var", (key, value) => manager.vars.set(key, value));
  }

  public override async __events(ctx: Context): Promise<void> {
    await this.manager.apply(ctx);
    this._sendScenes();
  }

  public override async __run(ctx: Context): Promise<void> {
    await this.manager.apply(ctx);
    this._sendScenes();
  }

  public override async __clear(): Promise<void> {
    this._manager?.reset();
  }

  /** The loaded scenes and the vars, as the editor's `scenes` event carries them. */
  public editorScenes(): EditorScenes {
    const manager = this.manager;
    return {
      loaded: manager.chain.map(({ id, params }) => ({ id, params: toEditorValue(params) })),
      vars: manager.vars.entries().map(({ key, value, owner, persistent }) => {
        const ownerId = owner && manager.idOfScene(owner);
        return {
          key,
          value: toEditorValue(value),
          ...(ownerId && { owner: ownerId }),
          persistent,
        };
      }),
      known: manager.knownIds,
    };
  }

  /** The scene manager. */
  public get manager(): SceneManager {
    if (!this._manager) this.throwNotInitializedError();
    return this._manager;
  }

  public override expose(): ScenesContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      load: (ctx, scene, options) => library.manager.load(ctx, scene, options),
      unload: (ctx, scene) => library.manager.unload(ctx, scene),
      get current() {
        return library.manager.current;
      },
      get loaded() {
        return library.manager.loaded;
      },
      isLoaded: (scene) => library.manager.isLoaded(scene),
      get vars() {
        return library.manager.vars.api();
      },
    };
  }

  /** Sends the scenes when the editor asked for them and they changed, at most every `intervalMs`. */
  private _sendScenes(now: number = Date.now()): void {
    const interval = this._editor?.welcome?.features.scenes?.intervalMs;
    if (!this._editor || interval === undefined || now - this._lastSent < interval) return;
    this._lastSent = now;
    const scenes = this.editorScenes();
    const json = JSON.stringify(scenes);
    if (json === this._lastJson) return;
    this._lastJson = json;
    this._editor.emit("scenes", scenes);
  }
}
