import { BaseAssetManagerLibrary, type InitContext } from "@nanoforge/common";

export class AssetManagerLibrary extends BaseAssetManagerLibrary {
  private _assets: Map<string, string>;
  private _wasm: Map<string, string>;
  private _wgsl: Map<string, string>;

  get name(): string {
    return "AssetManagerLibrary";
  }

  public async init(context: InitContext): Promise<void> {
    this._assets = context.files.assets;
    this._wasm = context.files.wasm;
    this._wgsl = context.files.wgsl;
  }

  /**
   * @todo Error management
   */
  public async getAsset(path: string): Promise<string> {
    const res = this._assets.get(this._parsePath(path));
    if (!res) throw new Error("Asset not found.");
    return res;
  }

  /**
   * @todo Error management
   */
  public async getWasm(path: string): Promise<string> {
    const res = this._wasm.get(this._parsePath(path));
    if (!res) throw new Error("Asset not found.");
    return res;
  }

  /**
   * @todo Error management
   */
  public async getWgsl(path: string): Promise<string> {
    const res = this._wgsl.get(this._parsePath(path));
    if (!res) throw new Error("Asset not found.");
    return res;
  }

  private _parsePath(path: string): string {
    return path
      .replace(/^(\/*)/, "/")
      .replaceAll(/(\/+)/g, "/")
      .replace(/(\/+)$/, "");
  }
}
