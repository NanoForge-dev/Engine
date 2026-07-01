import { type NfFile } from "../../../../common";
import { type IExposedLibrary } from "../bases/exposed.library.type";

/**
 * Interface for asset-manager libraries.
 *
 * @remarks
 * Implemented by `BaseAssetManagerLibrary` and its concrete subclass
 * `AssetManagerLibrary`.  Access an instance via
 * `ctx.libraries.getAssetManager().library`.
 */
export interface IAssetManagerLibrary extends IExposedLibrary {
  /**
   * Retrieve a registered file asset by its virtual path.
   *
   * @param path - Virtual path of the asset (e.g. "/textures/hero.png").
   * @returns An `NfFile` handle for the requested asset, or `undefined` if no asset path is provided.
   * @throws `NfNotFound` When no asset is registered at the given path.
   */
  getAsset(path: string): NfFile;
  getAsset(path: "" | undefined): undefined;
}
