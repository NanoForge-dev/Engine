import { BaseGraphicsLibrary, type ExecutionContext, type InitContext } from "@nanoforge/common";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  get name(): string {
    return "Graphics2DLibrary";
  }

  public async init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
  }

  public async run(context: ExecutionContext): Promise<void> {
    console.log(context);
  }
}
