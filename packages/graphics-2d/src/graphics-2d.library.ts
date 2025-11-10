import { BaseGraphicsLibrary, type InitContext } from "@nanoforge/common";

import { Graphics } from ".";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  private _stage?: Graphics.Stage;

  get __name(): string {
    return "Graphics2DLibrary";
  }

  get stage(): Graphics.Stage {
    if (!this._stage) this.throwNotInitializedError();
    return this._stage;
  }

  public async __init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
    this._stage = new Graphics.Stage({
      container: context.canvas.parentElement as HTMLDivElement,
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  public async __run(): Promise<void> {}
}
