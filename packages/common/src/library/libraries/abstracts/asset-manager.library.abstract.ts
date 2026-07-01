import { type NfFile } from "../../../common";
import { type InitContext } from "../../../context";
import { type IAssetManagerLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for asset-manager libraries.
 *
 * @remarks
 * Extend this class to implement a custom asset-manager and register it with
 * `NanoforgeApplication.useAssetManager`.  The built-in implementation
 * is `AssetManagerLibrary`.
 */
export abstract class BaseAssetManagerLibrary extends Library implements IAssetManagerLibrary {
  /** @internal */
  public abstract override __init(context: InitContext): Promise<void>;

  /**
   * Retrieve a file asset by its virtual path.
   *
   * @param path - Virtual path as registered in the engine's file map (e.g. "/textures/hero.png").
   * @returns An `NfFile` handle that lazily fetches the asset content.
   * @throws `NfNotFound` When no asset is registered at the given path.
   * @throws `NfNotInitializedException` When called before `__init` has resolved.
   */
  public abstract getAsset(path: string): NfFile;
  public abstract getAsset(path: "" | undefined): undefined;
}
