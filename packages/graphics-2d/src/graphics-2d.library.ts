import { BaseGraphicsLibrary, type InitContext } from "@nanoforge-dev/common";

import * as Graphics from "./exports/konva";

/**
 * Built-in 2D graphics library powered by [Konva](https://konvajs.org/).
 *
 * @remarks
 * Creates a full-window Konva `Stage` and a default `Layer` during
 * initialisation.  Game code interacts with the stage and layer directly to
 * add shapes, images, and animations.  Register with the application:
 *
 * ```ts
 * client.useGraphics(new Graphics2DLibrary());
 * ```
 *
 * Access in game code:
 * ```ts
 * const gfx = ctx.libraries.getGraphics<Graphics2DLibrary>().library;
 * const rect = new Konva.Rect(`x: 10, y: 10, width: 100, height: 50, fill: "red" `);
 * gfx.baseLayer.add(rect);
 * ```
 */
export class Graphics2DLibrary extends BaseGraphicsLibrary {
  private _stage?: Graphics.Stage;
  private _baseLayer?: Graphics.Layer;

  /** @internal */
  get __name(): string {
    return "Graphics2DLibrary";
  }

  /**
   * The Konva `Stage` that covers the container element.
   *
   * @remarks
   * Initialised to the container's `offsetWidth` × `offsetHeight` dimensions.
   *
   * @throws `NfNotInitializedException` When accessed before `__init` has resolved.
   */
  get stage(): Graphics.Stage {
    if (!this._stage) this.throwNotInitializedError();
    return this._stage;
  }

  /**
   * The default Konva `Layer` automatically added to the stage.
   *
   * @remarks
   * Add shapes and nodes to this layer for them to appear on screen.
   *
   * @throws `NfNotInitializedException` When accessed before `__init` has resolved.
   */
  get baseLayer(): Graphics.Layer {
    if (!this._baseLayer) this.throwNotInitializedError();
    return this._baseLayer;
  }

  /** @internal */
  public override async __init(context: InitContext): Promise<void> {
    if (!context.container) {
      throw new Error("Can't initialize the container context");
    }
    this._stage = new Graphics.Stage({
      container: context.container,
      width: context.container.offsetWidth,
      height: context.container.offsetHeight,
    });
    this._baseLayer = new Graphics.Layer();
    this._stage.add(this._baseLayer);
  }

  /** @internal */
  public async __run(): Promise<void> {}

  /** @internal */
  public override async __clear(): Promise<void> {
    this._stage?.destroy();
    delete (window as any).Konva;
  }
}
