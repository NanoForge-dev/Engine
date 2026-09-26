import {
  type AssetContext,
  type InitContext,
  Library,
  NfFile,
  NfNotFound,
  defineLibraryKey,
} from "@nanoforge-dev/common";

export const ASSET_LIBRARY_KEY = "assets" as const;

/**
 * Built-in asset library.
 *
 * @remarks
 * Auto-registered by `@nanoforge-dev/core` — app code never calls
 * `app.use(new AssetLibrary())` directly. Stores the virtual file map
 * injected by the NanoForge loader and exposes it via `getAsset`, always
 * available on `Context.assets`.
 *
 * File paths are normalised on lookup: leading/duplicate slashes collapse
 * to a single `/`, and a trailing slash is stripped.
 */
export class AssetLibrary extends Library {
  readonly key = defineLibraryKey(ASSET_LIBRARY_KEY);

  private _assets?: Map<string, string>;

  public override async __init(ctx: InitContext): Promise<void> {
    this._assets = ctx.files;
  }

  /**
   * Retrieve a registered file asset by its virtual path.
   *
   * @param path - Virtual path of the asset (e.g. "/textures/hero.png").
   * @returns An `NfFile` handle, or `undefined` if no path is given.
   * @throws `NfNotFound` When no asset is registered at the given path.
   * @throws `NfNotInitializedException` When called before `__init` resolves.
   */
  public getAsset(path: string): NfFile;
  public getAsset(path: "" | undefined): undefined;
  public getAsset(path: string | undefined): NfFile | undefined {
    if (!this._assets) this.throwNotInitializedError();
    if (!path) return undefined;

    const url = this._assets.get(this._normalize(path));
    if (!url) throw new NfNotFound(path, "Asset");
    return new NfFile(url);
  }

  public override expose(): AssetContext {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const library = this;
    return {
      getAsset: (path: any): any => library.getAsset(path),
    };
  }

  private _normalize(path: string): string {
    const collapsed = path.replace(/\/{2,}/g, "/");
    const withLeadingSlash = collapsed.startsWith("/") ? collapsed : `/${collapsed}`;
    return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, "") : withLeadingSlash;
  }
}
