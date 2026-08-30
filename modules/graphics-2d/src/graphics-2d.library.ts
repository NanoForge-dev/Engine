import { type Context, type InitContext, Library, defineLibraryKey } from "@nanoforge-dev/common";
// Side-effect-only: loads Context.editor/Context.ecs augmentations for the
// optional editor-drag integration below. graphics-2d is client-only, so
// it only ever coexists with @nanoforge-dev/ecs/client (never /server) in practice.
import type { Registry } from "@nanoforge-dev/ecs/client";
import type {} from "@nanoforge-dev/editor-lib";

import * as Graphics from "./exports/konva";
import type { GraphicsContextApi } from "./graphics-context.type";

type DragSystemEditor = NonNullable<Context["editor"]>;

/**
 * Built-in 2D graphics library powered by [Konva](https://konvajs.org/).
 *
 * @remarks
 * Creates a full-container Konva `Stage` and a default `Layer` during
 * `__init`. Game code interacts with `Context.graphics.stage`/`.baseLayer`
 * directly to add shapes, images, and animations. Client-only — `__init`
 * throws if `InitContext.container` is missing.
 */
export class Graphics2DLibrary extends Library {
  readonly key = defineLibraryKey("graphics");

  private _stage?: Graphics.Stage;
  private _baseLayer?: Graphics.Layer;
  private _editorDragWired = false;

  public override async __init(ctx: InitContext): Promise<void> {
    if (!ctx.container) {
      throw new Error(
        "Graphics2DLibrary must be registered on the client (InitContext must contain a container element).",
      );
    }
    this._stage = new Graphics.Stage({
      container: ctx.container,
      width: ctx.container.offsetWidth,
      height: ctx.container.offsetHeight,
    });
    this._baseLayer = new Graphics.Layer();
    this._stage.add(this._baseLayer);
  }

  public override async __clear(): Promise<void> {
    this._stage?.destroy();
    delete (window as unknown as { Konva?: unknown }).Konva;
  }

  /**
   * When both an editor bridge and ecs are registered, makes drawable
   * shapes (`DrawableCircle2D`/`DrawableRect2D`/`DrawableText2D`) draggable
   * in the viewport and notifies the editor on drag end. No-op otherwise —
   * plain graphics-2d usage is entirely unaffected.
   *
   * @remarks
   * One-time wiring lives in `__events` (always runs, even while paused),
   * not `__run` — so it isn't blocked behind an app that starts paused.
   */
  public override async __events(ctx: Context): Promise<void> {
    if (!this._editorDragWired && ctx.editor && ctx.ecs) {
      ctx.ecs.registry.addSystem(this._dragSystem(ctx.editor));
      this._editorDragWired = true;
    }
  }

  public get stage(): Graphics.Stage {
    if (!this._stage) this.throwNotInitializedError();
    return this._stage;
  }

  public get baseLayer(): Graphics.Layer {
    if (!this._baseLayer) this.throwNotInitializedError();
    return this._baseLayer;
  }

  public override expose(): GraphicsContextApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      get stage() {
        return library.stage;
      },
      get baseLayer() {
        return library.baseLayer;
      },
    };
  }

  private _dragSystem(editor: DragSystemEditor): (registry: Registry) => void {
    const wiredComponents = new Map<string, Set<string>>();

    return (registry: Registry) => {
      const entities = [
        ...registry.getZipper([{ name: "__RESERVED_entityId" }, { name: "DrawableCircle2D" }]),
        ...registry.getZipper([{ name: "__RESERVED_entityId" }, { name: "DrawableRect2D" }]),
        ...registry.getZipper([{ name: "__RESERVED_entityId" }, { name: "DrawableText2D" }]),
      ];

      for (const entry of entities as any[]) {
        const { __RESERVED_entityId, DrawableCircle2D, DrawableRect2D, DrawableText2D } = entry;
        const entityId = __RESERVED_entityId.entityId;

        if (!wiredComponents.has(entityId)) wiredComponents.set(entityId, new Set());
        const wired = wiredComponents.get(entityId) as Set<string>;

        for (const comp of [DrawableCircle2D, DrawableRect2D, DrawableText2D]) {
          if (!comp || wired.has(comp.name)) continue;

          comp.shape.draggable(true);
          comp.shape.on("dragend", ({ target }: any) => {
            editor.emit("move-component", entityId, comp.name, target._lastPos);
          });
          wired.add(comp.name);
        }
      }
    };
  }
}
