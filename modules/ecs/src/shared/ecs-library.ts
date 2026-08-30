import {
  type Context,
  type InitContext,
  Library,
  NfNotFound,
  defineLibraryKey,
} from "@nanoforge-dev/common";

import type { Entity, MainModule, Registry } from "../../lib/web/libecs";
import type { EcsContextApi } from "./ecs-context.type";

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
 * If registered alongside `@nanoforge-dev/editor-lib`'s `EditorLibrary`, listens
 * for a `"hot-reload"` command and applies it via `registry.addComponent`.
 *
 * Not exported directly — `@nanoforge-dev/ecs/client` and `.../server` each
 * subclass this with their own compiled `Module` factory, since the actual
 * WASM binary differs by target environment (browser vs Node) even though
 * this class's logic is identical either way.
 */
export abstract class EcsLibrary extends Library {
  readonly key = defineLibraryKey("ecs");

  private _module?: MainModule;
  private _registry?: Registry;

  protected constructor(private readonly loadModule: LoadEcsModule) {
    super({ runAfter: ["graphics"] });
  }

  public override async __init(ctx: InitContext): Promise<void> {
    const wasmUrl = ctx.files.get("libecs.wasm");
    if (!wasmUrl) throw new NfNotFound("libecs.wasm", "Asset");

    this._module = await this.loadModule({ locateFile: () => wasmUrl });
    this._registry = new this._module.Registry();

    if (ctx.editor) {
      ctx.editor.fromEditor.on("hot-reload", (...args: unknown[]) => {
        const [entity, component] = args as [Entity, Parameters<Registry["addComponent"]>[1]];
        this.registry.addComponent(entity, component);
      });
    }
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
