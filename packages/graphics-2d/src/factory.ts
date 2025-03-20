import { NfgCircle, NfgRectangle } from "./components";
import { type GraphicsCore } from "./core";
import { type ICircleOptions, type IRectangleOptions } from "./types";

export class GraphicsFactory {
  private readonly _core: GraphicsCore;

  constructor(core: GraphicsCore) {
    this._core = core;
  }

  createCircle(options?: Partial<ICircleOptions>): Promise<NfgCircle> {
    return new NfgCircle(this._core, options).init();
  }

  createRectangle(options?: Partial<IRectangleOptions>): Promise<NfgRectangle> {
    return new NfgRectangle(this._core, options).init();
  }
}
