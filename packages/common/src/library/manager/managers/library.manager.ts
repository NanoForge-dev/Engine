import {
  ASSET_MANAGER_LIBRARY,
  COMPONENT_SYSTEM_LIBRARY,
  GRAPHICS_LIBRARY,
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type IInputLibrary,
  type IMusicLibrary,
  type INetworkLibrary,
  type ISoundLibrary,
  MUSIC_LIBRARY,
  NETWORK_LIBRARY,
  SOUND_LIBRARY,
} from "../../libraries";
import { type LibraryHandle } from "../handle/library.handle";
import { BaseLibraryManager } from "./base-library.manager";

/**
 * Numeric index keys for the built-in library slots.
 *
 * @remarks
 * Used internally by `LibraryManager` to keep O(1) access to the well-known
 * library positions.  Game code should not reference these values directly —
 * use the typed accessor methods on `LibraryManager` instead.
 */
export enum DefaultLibrariesEnum {
  ASSET_MANAGER,
  COMPONENT_SYSTEM,
  GRAPHICS,
  INPUT,
  NETWORK,
  SOUND,
  MUSIC,
}

const DEFAULT_LIBRARIES: { index: DefaultLibrariesEnum; sym: symbol }[] = [
  { index: DefaultLibrariesEnum.ASSET_MANAGER, sym: ASSET_MANAGER_LIBRARY },
  { index: DefaultLibrariesEnum.COMPONENT_SYSTEM, sym: COMPONENT_SYSTEM_LIBRARY },
  { index: DefaultLibrariesEnum.GRAPHICS, sym: GRAPHICS_LIBRARY },
  { index: DefaultLibrariesEnum.NETWORK, sym: NETWORK_LIBRARY },
  { index: DefaultLibrariesEnum.SOUND, sym: SOUND_LIBRARY },
  { index: DefaultLibrariesEnum.MUSIC, sym: MUSIC_LIBRARY },
];

/**
 * Central registry for all libraries registered with a NanoForge application.
 *
 * @remarks
 * An instance is available inside every lifecycle context via
 * `BaseContext.libraries`.  Use the typed accessor methods to retrieve
 * any built-in library, or call `BaseLibraryManager.get` with a custom
 * symbol for user-defined libraries.
 *
 * @example
 * ```ts
 * // Inside a library's __init hook:
 * override async __init(ctx: InitContext) {
 *   const assetMgr = ctx.libraries.getAssetManager().library;
 *   const file = assetMgr.getAsset("/data.json");
 * }
 * ```
 */
export class LibraryManager extends BaseLibraryManager {
  constructor() {
    super();

    for (const { index, sym } of DEFAULT_LIBRARIES) {
      this._setIndex(sym, index);
    }
  }

  /**
   * Retrieve the registered component-system (ECS) library.
   *
   * @typeParam T - Concrete component-system library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getComponentSystem<
    T extends IComponentSystemLibrary = IComponentSystemLibrary,
  >(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.COMPONENT_SYSTEM);
  }

  /**
   * Retrieve the registered graphics library.
   *
   * @typeParam T - Concrete graphics library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getGraphics<T extends IGraphicsLibrary = IGraphicsLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.GRAPHICS);
  }

  /**
   * Retrieve the registered network library.
   *
   * @typeParam T - Concrete network library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getNetwork<T extends INetworkLibrary = INetworkLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.NETWORK);
  }

  /**
   * Retrieve the registered input library.
   *
   * @typeParam T - Concrete input library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getInput<T extends IInputLibrary = IInputLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.INPUT);
  }

  /**
   * Retrieve the registered asset-manager library.
   *
   * @typeParam T - Concrete asset-manager library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getAssetManager<
    T extends IAssetManagerLibrary = IAssetManagerLibrary,
  >(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.ASSET_MANAGER);
  }

  /**
   * Retrieve the registered sound library.
   *
   * @typeParam T - Concrete sound library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getSound<T extends ISoundLibrary = ISoundLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.SOUND);
  }

  /**
   * Retrieve the registered music library.
   *
   * @typeParam T - Concrete music library type.
   * @returns A `LibraryHandle` wrapping the library instance.
   */
  public getMusic<T extends IMusicLibrary = IMusicLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.MUSIC);
  }
}
