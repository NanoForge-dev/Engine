import { NfgCircle } from "./components";
import { type GraphicsCore } from "./core";
import { type ICircleOptions } from "./types";

export class GraphicsFactory {
  private readonly _core: GraphicsCore;

  constructor(core: GraphicsCore) {
    this._core = core;
  }

  createCircle(options?: Partial<ICircleOptions>): Promise<NfgCircle> {
    return new NfgCircle(this._core, options).init();
  }
}
