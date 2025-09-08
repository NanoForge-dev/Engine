import {
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type IInputLibrary,
  type ILibrary,
  type INetworkLibrary,
  type ISoundLibrary,
  type LibraryHandle,
} from "@nanoforge/common";

import { EditableLibraryManager } from "../common/library/manager/library.manager";

export class ApplicationConfig {
  private readonly _libraryManager: EditableLibraryManager;

  constructor() {
    this._libraryManager = new EditableLibraryManager();
  }

  get libraryManager(): EditableLibraryManager {
    return this._libraryManager;
  }

  public getLibrary(sym: symbol): LibraryHandle<ILibrary> {
    return this._libraryManager.get(sym);
  }

  public useLibrary(sym: symbol, library: ILibrary): void {
    this._libraryManager.set(sym, library);
  }

  public getComponentSystemLibrary() {
    return this._libraryManager.getComponentSystem();
  }

  public useComponentSystemLibrary(library: IComponentSystemLibrary) {
    this._libraryManager.setComponentSystem(library);
  }

  public getGraphicsLibrary() {
    return this._libraryManager.getGraphics();
  }

  public useGraphicsLibrary(library: IGraphicsLibrary) {
    this._libraryManager.setGraphics(library);
  }

  public getNetworkLibrary() {
    return this._libraryManager.getNetwork();
  }

  public useNetworkLibrary(library: INetworkLibrary) {
    this._libraryManager.setNetwork(library);
  }

  public getAssetManagerLibrary() {
    return this._libraryManager.getAssetManager();
  }

  public useAssetManagerLibrary(library: IAssetManagerLibrary) {
    this._libraryManager.setAssetManager(library);
  }

  public getInputLibrary() {
    return this._libraryManager.getInput();
  }

  public useInputLibrary(library: IInputLibrary) {
    this._libraryManager.setInput(library);
  }

  public getSoundLibrary() {
    return this._libraryManager.getSound();
  }

  public useSoundLibrary(library: ISoundLibrary) {
    this._libraryManager.setSound(library);
  }
}
