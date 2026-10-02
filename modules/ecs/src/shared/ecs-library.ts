import {
  type Context,
  type InitContext,
  Library,
  NfNotFound,
  defineLibraryKey,
} from "@nanoforge-dev/common";
import type { EditorAwareLibrary, EditorInitContext } from "@nanoforge-dev/editor-lib";

import type { Entity, MainModule, Registry } from "../../lib/web/libecs";
import type { EcsContextApi } from "./ecs-context.type";
import { EditorWorldTracker } from "./editor-world";

/** Loads the compiled WASM module — supplied by the client/server entry point. */
export type LoadEcsModule = (options: { locateFile: () => string }) => Promise<MainModule>;

/**
 * ECS library backed by the compiled WASM module.
 *
 * @remarks
 * Loads `libecs.wasm` from `InitContext.files` directly (not `ctx.assets` —
 * `Context` doesn't exist yet during `__init`, same phase-boundary
 * constraint every library has) and initialises the entity registry.
 *
 * When an editor started the game (`@nanoforge-dev/editor-lib`'s
 * `EditorLibrary`), listens for a `"hot-reload"` command and applies it via
 * `registry.addComponent`.
 *
 * Not exported directly — `@nanoforge-dev/ecs/client` and `.../server` each
 * subclass this with their own compiled `Module` factory, since the actual
 * WASM binary differs by target environment (browser vs Node) even though
 * this class's logic is identical either way.
 */
export abstract class EcsLibrary extends Library implements EditorAwareLibrary {
  readonly key = defineLibraryKey("ecs");

  private _module?: MainModule;
  private _registry?: Registry;
  /** Live mode: set when an editor started the game. */
  private _editorWorld?: EditorWorldTracker;

  protected constructor(private readonly loadModule: LoadEcsModule) {
    super({ runAfter: ["graphics"] });
  }

  public override async __init(ctx: InitContext): Promise<void> {
    const wasmUrl = ctx.files.get("/libecs.wasm");
    if (!wasmUrl) throw new NfNotFound("/libecs.wasm", "Asset");

    this._module = await this.loadModule({ locateFile: () => wasmUrl });
    this._registry = new this._module.Registry();
    // From the start, before the editor's welcome: entities spawned at startup are recorded.
    if (ctx.editor) this._editorWorld = new EditorWorldTracker(this._registry);
  }

  /** Listens to the editor's commands (`hot-reload`, live mode). */
  public async __editorInit(ctx: EditorInitContext): Promise<void> {
    ctx.editor.on("hot-reload", (...args: unknown[]) => {
      const [entity, component] = args as [Entity, Parameters<Registry["addComponent"]>[1]];
      this.registry.addComponent(entity, component);
    });
    this._editorWorld?.attach(ctx.editor);
  }

  /** Live mode: runs every tick, paused ones too, so the editor sees the world while paused. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override async __events(_ctx: Context): Promise<void> {
    this._editorWorld?.tick();
  }

  public override async __run(ctx: Context): Promise<void> {
    this.registry.runSystems(ctx);
  }

  public get registry(): Registry {
    if (!this._registry) this.throwNotInitializedError();
    return this._registry;
  }

  public override expose(): EcsContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      get registry() {
        return library.registry;
      },
    };
  }
}
