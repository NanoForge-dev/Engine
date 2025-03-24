import {
  ASSET_MANAGER_LIBRARY,
  COMPONENT_SYSTEM_LIBRARY,
  DefaultLibrariesEnum,
  GRAPHICS_LIBRARY,
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type IInputLibrary,
  type ILibrary,
  INPUT_LIBRARY,
  type INetworkLibrary,
  type IRunnerLibrary,
  type LibraryHandle,
  LibraryManager,
  NETWORK_LIBRARY,
} from "@nanoforge/common";

import { EditableLibraryContext } from "../../context/contexts/library.editable-context";

export class EditableLibraryManager extends LibraryManager {
  public set(sym: symbol, library: ILibrary) {
    this.setNewLibrary(sym, library, new EditableLibraryContext());
  }

  public setComponentSystem(library: IComponentSystemLibrary): void {
    this._set(
      DefaultLibrariesEnum.COMPONENT_SYSTEM,
      COMPONENT_SYSTEM_LIBRARY,
      library,
      new EditableLibraryContext(),
    );
  }

  public setGraphics(library: IGraphicsLibrary): void {
    this._set(
      DefaultLibrariesEnum.GRAPHICS,
      GRAPHICS_LIBRARY,
      library,
      new EditableLibraryContext(),
    );
  }

  public setAssetManager(library: IAssetManagerLibrary): void {
    this._set(
      DefaultLibrariesEnum.ASSET_MANAGER,
      ASSET_MANAGER_LIBRARY,
      library,
      new EditableLibraryContext(),
    );
  }

  public setNetwork(library: INetworkLibrary): void {
    this._set(DefaultLibrariesEnum.NETWORK, NETWORK_LIBRARY, library, new EditableLibraryContext());
  }

  public setInput(library: IInputLibrary): void {
    this._set(DefaultLibrariesEnum.INPUT, INPUT_LIBRARY, library, new EditableLibraryContext());
  }

  public getLibraries(): LibraryHandle<ILibrary>[] {
    return this._libraries;
  }

  public getInitLibraries(): LibraryHandle<ILibrary>[] {
    return this._libraries;
  }

  public getExecutionLibraries(): LibraryHandle<IRunnerLibrary>[] {
    return this._getRunnerLibraries();
  }

  public getClearLibraries(): LibraryHandle<ILibrary>[] {
    return this._libraries;
  }

  private _getRunnerLibraries(): LibraryHandle<IRunnerLibrary>[] {
    return this._libraries.filter(
      (handle) => handle && typeof handle.library["run"] === "function",
    ) as LibraryHandle<IRunnerLibrary>[];
  }
}
