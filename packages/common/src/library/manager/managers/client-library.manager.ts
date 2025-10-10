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

export class ClientLibraryManager {
  private readonly _libraryManager: LibraryManager;

  constructor(libraryManager: LibraryManager) {
    this._libraryManager = libraryManager;
  }

  public get<T extends ILibrary = ILibrary>(sym: symbol): T {
    return this._libraryManager.get<T>(sym).library;
  }

  public getComponentSystem<T extends IComponentSystemLibrary = IComponentSystemLibrary>(): T {
    return this._libraryManager.getComponentSystem<T>().library;
  }

  public getGraphics<T extends IGraphicsLibrary = IGraphicsLibrary>(): T {
    return this._libraryManager.getGraphics<T>().library;
  }

  public getNetwork<T extends INetworkLibrary = INetworkLibrary>(): T {
    return this._libraryManager.getNetwork<T>().library;
  }

  public getInput<T extends IInputLibrary = IInputLibrary>(): T {
    return this._libraryManager.getInput<T>().library;
  }

  public getAssetManager<T extends IAssetManagerLibrary = IAssetManagerLibrary>(): T {
    return this._libraryManager.getAssetManager<T>().library;
  }

  public getSound<T extends ISoundLibrary = ISoundLibrary>(): T {
    return this._libraryManager.getSound<T>().library;
  }

  public getMusic<T extends IMusicLibrary = IMusicLibrary>(): T {
    return this._libraryManager.getMusic<T>().library;
  }
}
