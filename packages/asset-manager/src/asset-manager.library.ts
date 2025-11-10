import { BaseAssetManagerLibrary, type InitContext, NfFile, NfNotFound } from "@nanoforge/common";

export class AssetManagerLibrary extends BaseAssetManagerLibrary {
  private _assets?: Map<string, string>;

  get __name(): string {
    return "AssetManagerLibrary";
  }

  public async __init(context: InitContext): Promise<void> {
    this._assets = context.files;
  }

  public getAsset(path: string): NfFile {
    if (!this._assets) this.throwNotInitializedError();
    const res = this._assets.get(this._parsePath(path));
    if (!res) throw new NfNotFound(path, "Asset");
    return new NfFile(res);
  }

  private _parsePath(path: string): string {
    return path
      .replace(/^(\/*)/, "/")
      .replaceAll(/(\/+)/g, "/")
      .replace(/(\/+)$/, "");
  }
}
