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

  public async __run(): Promise<void> {}
}
