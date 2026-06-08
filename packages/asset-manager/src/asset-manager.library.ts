import {
  BaseAssetManagerLibrary,
  type InitContext,
  NfFile,
  NfNotFound,
} from "@nanoforge-dev/common";

/**
 * Built-in asset-manager library.
 *
 * @remarks
 * Stores the file map injected by the NanoForge bundler (`nf build`) and
 * exposes assets via `getAsset`.  Register it with the application before
 * calling `init`:
 *
 * ```ts
 * const client = NanoforgeFactory.createClient();
 * client.useAssetManager(new AssetManagerLibrary());
 * await client.init(`container, files, env `);
 * ```
 *
 * File paths are normalised on lookup: leading slashes are collapsed to a
 * single `/`, duplicate slashes are removed, and trailing slashes are stripped.
 */
export class AssetManagerLibrary extends BaseAssetManagerLibrary {
  private _assets?: Map<string, string>;

  /** @internal */
  get __name(): string {
    return "AssetManagerLibrary";
  }

  /** @internal */
  public async __init(context: InitContext): Promise<void> {
    this._assets = context.files;
  }

  /**
   * Retrieve a registered file asset by its virtual path.
   *
   * @remarks
   * The path is normalised before lookup: leading and duplicate slashes are
   * collapsed and trailing slashes are removed.
   *
   * @param path - Virtual path of the asset (e.g. "/textures/hero.png").
   * @returns An `NfFile` handle for the requested asset.
   * @throws `NfNotFound` When no asset is registered at the given path.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
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
