import { BaseGraphicsLibrary, type InitContext } from "@nanoforge/common";

import { Graphics } from ".";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  private _stage: Graphics.Stage;

  get name(): string {
    return "Graphics2DLibrary";
  }

  get stage(): Graphics.Stage {
    return this._stage;
  }

  public async init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
    this._stage = new Graphics.Stage({
      container: context.canvas.parentElement as HTMLDivElement,
      width: context.canvas.width,
      height: context.canvas.height,
    });
  }

  public async run(): Promise<void> {}
}
