import { ASSET_MANAGER_LIBRARY, BaseGraphicsLibrary, type InitContext } from "@nanoforge/common";

import { GraphicsCore } from "./core";
import { GraphicsFactory } from "./factory";
import { type NfgWindow } from "./render/window";

export class Graphics2DLibrary extends BaseGraphicsLibrary {
  private _core: GraphicsCore;
  private _factory: GraphicsFactory;

  constructor() {
    super({
      dependencies: [ASSET_MANAGER_LIBRARY],
    });
  }

  get name(): string {
    return "Graphics2DLibrary";
  }

  get factory(): GraphicsFactory {
    return this._factory;
  }

  public async init(context: InitContext): Promise<void> {
    if (!context.canvas) {
      throw new Error("Can't initialize the canvas context");
    }
    this._core = new GraphicsCore(context);
    await this._core.init();
    this._factory = new GraphicsFactory(this._core);
  }

  public async run(): Promise<void> {
    this._core.window.render();
  }

  public getWindow(): NfgWindow {
    return this._core.window;
  }
}
