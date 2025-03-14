import {
  COMPONENT_SYSTEM_LIBRARY,
  DefaultLibrariesEnum,
  GRAPHICS_LIBRARY,
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type ILibrary,
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

  public setNetwork(library: INetworkLibrary): void {
    this._set(DefaultLibrariesEnum.NETWORK, NETWORK_LIBRARY, library, new EditableLibraryContext());
  }

  public getLibraries(): LibraryHandle<ILibrary>[] {
    return this._libraries;
  }

  public getRunnerLibraries(): LibraryHandle<IRunnerLibrary>[] {
    return this._libraries.filter(
      (library) => typeof library["run"] === "function",
    ) as LibraryHandle<IRunnerLibrary>[];
  }
}
