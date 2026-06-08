import {
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type IInputLibrary,
  type ILibrary,
  type IMusicLibrary,
  type INetworkLibrary,
  type ISoundLibrary,
} from "../../libraries";
import { type LibraryManager } from "./library.manager";

/**
 * Convenience wrapper around `LibraryManager` that unwraps
 * `LibraryHandle` values and returns the library instance directly.
 *
 * @remarks
 * Typically accessed inside a library's lifecycle hooks through the execution
 * context's `libraries` property after being constructed with a concrete
 * `LibraryManager`.
 */
export class ClientLibraryManager {
  private readonly _libraryManager: LibraryManager;

  /**
   * @param libraryManager - The underlying manager to delegate lookups to.
   */
  constructor(libraryManager: LibraryManager) {
    this._libraryManager = libraryManager;
  }

  /**
   * Retrieve a library registered under a custom symbol.
   *
   * @typeParam T - Expected library type.
   * @param sym - The symbol the library was registered with.
   * @returns The unwrapped library instance.
   */
  public get<T extends ILibrary = ILibrary>(sym: symbol): T {
    return this._libraryManager.get<T>(sym).library;
  }

  /**
   * Retrieve the registered component-system (ECS) library instance.
   *
   * @typeParam T - Concrete component-system library type.
   */
  public getComponentSystem<T extends IComponentSystemLibrary = IComponentSystemLibrary>(): T {
    return this._libraryManager.getComponentSystem<T>().library;
  }

  /**
   * Retrieve the registered graphics library instance.
   *
   * @typeParam T - Concrete graphics library type.
   */
  public getGraphics<T extends IGraphicsLibrary = IGraphicsLibrary>(): T {
    return this._libraryManager.getGraphics<T>().library;
  }

  /**
   * Retrieve the registered network library instance.
   *
   * @typeParam T - Concrete network library type.
   */
  public getNetwork<T extends INetworkLibrary = INetworkLibrary>(): T {
    return this._libraryManager.getNetwork<T>().library;
  }

  /**
   * Retrieve the registered input library instance.
   *
   * @typeParam T - Concrete input library type.
   */
  public getInput<T extends IInputLibrary = IInputLibrary>(): T {
    return this._libraryManager.getInput<T>().library;
  }

  /**
   * Retrieve the registered asset-manager library instance.
   *
   * @typeParam T - Concrete asset-manager library type.
   */
  public getAssetManager<T extends IAssetManagerLibrary = IAssetManagerLibrary>(): T {
    return this._libraryManager.getAssetManager<T>().library;
  }

  /**
   * Retrieve the registered sound library instance.
   *
   * @typeParam T - Concrete sound library type.
   */
  public getSound<T extends ISoundLibrary = ISoundLibrary>(): T {
    return this._libraryManager.getSound<T>().library;
  }

  /**
   * Retrieve the registered music library instance.
   *
   * @typeParam T - Concrete music library type.
   */
  public getMusic<T extends IMusicLibrary = IMusicLibrary>(): T {
    return this._libraryManager.getMusic<T>().library;
  }
}
