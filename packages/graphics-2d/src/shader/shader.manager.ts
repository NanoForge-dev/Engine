import { type AssetManagerLibrary } from "@nanoforge/asset-manager";

import { type GraphicsCore } from "../core";
import { SHADER_NAMES, SHADER_PATHS } from "./shaders.const";
import { type ShadersEnum } from "./shaders.enum";

export class ShaderManager {
  private _core: GraphicsCore;
  private _assetManager: AssetManagerLibrary;
  private _shaders: Map<ShadersEnum, GPUShaderModule>;

  constructor(core: GraphicsCore) {
    this._core = core;
    this._assetManager =
      this._core.initContext.libraries.getAssetManager<AssetManagerLibrary>().library;
    this._shaders = new Map();
  }

  /**
   * @todo Error handling
   */
  public async get(shader: ShadersEnum, reftech = true): Promise<GPUShaderModule> {
    const res = this._shaders.get(shader);
    if (!res) {
      if (!reftech) throw new Error("Could not find shader");
      await this._loadShader(shader);
      return this.get(shader, false);
    }
    return res;
  }

  /**
   * @todo Error handling
   */
  private async _loadShader(shader: ShadersEnum): Promise<void> {
    const path = SHADER_PATHS[shader];
    if (!path) {
      throw new Error("Could not find shader");
    }
    const shaderFile = await this._assetManager.getWgsl(path);
    this._shaders.set(
      shader,
      this._core.device.createShaderModule({
        label: SHADER_NAMES[shader],
        code: await shaderFile.getText(),
      }),
    );
  }
}
