import { BaseGraphicsLibrary, type InitContext } from "@nanoforge-dev/common";

import * as Graphics from "./exports/konva";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  private _stage?: Graphics.Stage;
  private _baseLayer?: Graphics.Layer;

  get __name(): string {
    return "Graphics2DLibrary";
  }

  get stage(): Graphics.Stage {
    if (!this._stage) this.throwNotInitializedError();
    return this._stage;
  }

  get baseLayer(): Graphics.Layer {
    if (!this._baseLayer) this.throwNotInitializedError();
    return this._baseLayer;
  }

  public override async __init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
    this._stage = new Graphics.Stage({
      container: context.canvas.parentElement as HTMLDivElement,
      width: context.canvas.offsetWidth,
      height: context.canvas.offsetHeight,
    });
    this._baseLayer = new Graphics.Layer();
    this._stage.add(this._baseLayer);
  }

  public async __run(): Promise<void> {}
}
