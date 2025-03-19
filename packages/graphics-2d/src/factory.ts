import { NfgCircle } from "./components/shape/shapes/circle.shape";
import { type GraphicsCore } from "./core";
import { type ICircleOptions } from "./types";

export class GraphicsFactory {
  private readonly _core: GraphicsCore;

  constructor(core: GraphicsCore) {
    this._core = core;
  }

  createCircle(options?: Partial<ICircleOptions>): NfgCircle {
    return new NfgCircle(this._core, options);
  }
}
