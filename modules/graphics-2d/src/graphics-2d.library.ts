import {
  type InitContext,
  Library,
  type ViewportState,
  defineLibraryKey,
} from "@nanoforge-dev/common";
import Konva from "konva";

import * as Graphics from "./exports/konva";
import type { GraphicsContextApi } from "./graphics-context.type";

/**
 * Built-in 2D graphics library powered by [Konva](https://konvajs.org/).
 *
 * @remarks
 * Creates a Konva `Stage` and a default `Layer` during `__init`. Game code
 * interacts with `Context.graphics.stage`/`.baseLayer` directly to add
 * shapes, images, and animations, in game coordinates (the design resolution
 * of `Context.viewport`). The stage follows every viewport change (window
 * resize, fullscreen, monitor switch, fit mode change): it is resized,
 * scaled, offset and letterboxed/cropped according to the viewport's fit. Client-only — `__init`
 * throws if `InitContext.container` is missing.
 */
export class Graphics2DLibrary extends Library {
  readonly key = defineLibraryKey("graphics");

  private _stage?: Graphics.Stage;
  private _baseLayer?: Graphics.Layer;
  private _unsubscribeViewport?: () => void;

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

    if (ctx.viewport) {
      this._applyViewport(ctx.viewport.state);
      this._unsubscribeViewport = ctx.viewport.onChange((state) => this._applyViewport(state));
    }
  }

  public override async __clear(): Promise<void> {
    this._unsubscribeViewport?.();
    this._unsubscribeViewport = undefined;
    this._stage?.destroy();
    delete (window as unknown as { Konva?: unknown }).Konva;
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

  /**
   * Sizes the canvas to the visible game area, scales/offsets the stage so
   * game coordinates map to the design resolution, and letterboxes it inside
   * the container.
   */
  private _applyViewport(state: ViewportState): void {
    const stage = this._stage;
    if (!stage) return;

    if (Konva.pixelRatio !== state.pixelRatio) {
      Konva.pixelRatio = state.pixelRatio;
      for (const layer of stage.getLayers()) layer.getCanvas().setPixelRatio(state.pixelRatio);
    }

    stage.size({ width: state.visibleWidth, height: state.visibleHeight });
    stage.scale({ x: state.scaleX, y: state.scaleY });
    stage.position({ x: state.originX, y: state.originY });
    stage.content.style.left = `${state.contentLeft}px`;
    stage.content.style.top = `${state.contentTop}px`;
    stage.batchDraw();
  }
}
