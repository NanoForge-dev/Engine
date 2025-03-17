import { BaseAssetManagerLibrary, type InitContext } from "@nanoforge/common";

export class AssetManagerLibrary extends BaseAssetManagerLibrary {
  private _assets: Map<string, string>;
  private _scripts: Map<string, string>;

  get name(): string {
    return "AssetManagerLibrary";
  }

  public async init(context: InitContext): Promise<void> {
    this._assets = context.files.assets;
    this._scripts = context.files.scripts;
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
  public async getScript(path: string): Promise<string> {
    const res = this._scripts.get(this._parsePath(path));
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
