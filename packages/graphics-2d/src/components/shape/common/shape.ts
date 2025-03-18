import { type GraphicsCore } from "../../../core";
import { type ShaderManager } from "../../../shader/shader.manager";

export class NfShape {
  private readonly _shaderManager: ShaderManager;

  constructor(core: GraphicsCore) {
    this._shaderManager = core.shaderManager;
  }
}
