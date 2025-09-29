import { ASSET_MANAGER_LIBRARY, BaseGraphicsLibrary, type InitContext } from "@nanoforge/common";
import { Display } from "redgpu";

import { GraphicsCore } from "./core";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  public Shape: typeof Display.Shape2D = Display.Shape2D;

  private _core: GraphicsCore;

  constructor() {
    super({
      dependencies: [ASSET_MANAGER_LIBRARY],
    });
  }

  get name(): string {
    return "Graphics2DLibrary";
  }

  public async init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
    this._core = new GraphicsCore();
    await this._core.init(context.canvas);
  }

  public async run(): Promise<void> {
    await this._core.render();
  }
}
