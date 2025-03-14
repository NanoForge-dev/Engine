import {
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type ILibrary,
  type INetworkLibrary,
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

  public useComponentSystemLibrary(componentSystemLibrary: IComponentSystemLibrary) {
    this._libraryManager.setComponentSystem(componentSystemLibrary);
  }

  public getGraphicsLibrary() {
    return this._libraryManager.getGraphics();
  }

  public useGraphicsLibrary(graphicsLibrary: IGraphicsLibrary) {
    this._libraryManager.setGraphics(graphicsLibrary);
  }

  public getNetworkLibrary() {
    return this._libraryManager.getNetwork();
  }

  public useNetworkLibrary(networkLibrary: INetworkLibrary) {
    this._libraryManager.setNetwork(networkLibrary);
  }
}
