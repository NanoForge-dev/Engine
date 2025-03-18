import { BaseGraphicsLibrary, type ExecutionContext, type InitContext } from "@nanoforge/common";

import { type ICircleOptions } from "./types";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  get name(): string {
    return "Graphics2DLibrary";
  }

  public async init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
  }

  public createCircle(options: ICircleOptions): void {}

  public async run(context: ExecutionContext): Promise<void> {
    console.log(context);
  }
}
