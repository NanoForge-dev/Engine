import { BaseAssetManagerLibrary, type InitContext } from "@nanoforge/common";

export class AssetManagerLibrary extends BaseAssetManagerLibrary {
  private _assets: Map<string, string>;
  private _scripts: Map<string, string>;

  get name(): string {
    return "AssetManagerLibrary";
  }

  public init(context: InitContext) {
    this._assets = context.files.assets;
    this._scripts = context.files.scripts;
    return Promise.resolve();
  }

  /**
   * @todo Error management
   */
  public getAsset(path: string): Promise<string> {
    const res = this._assets.get(this._parsePath(path));
    if (!res) throw new Error("Asset not found.");
    return Promise.resolve(res);
  }

  /**
   * @todo Error management
   */
  public getScript(path: string): Promise<string> {
    const res = this._scripts.get(this._parsePath(path));
    if (!res) throw new Error("Asset not found.");
    return Promise.resolve(res);
  }

  private _parsePath(path: string): string {
    return path
      .replace(/^(\/*)/, "/")
      .replaceAll(/(\/+)/g, "/")
      .replace(/(\/+)$/, "");
  }
}
