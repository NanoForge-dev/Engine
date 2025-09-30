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
  type IMusicLibrary,
  type IMutableLibrary,
  INPUT_LIBRARY,
  type INetworkLibrary,
  type IRunnerLibrary,
  type ISoundLibrary,
  type LibraryHandle,
  LibraryManager,
  MUSIC_LIBRARY,
  NETWORK_LIBRARY,
  SOUND_LIBRARY,
} from "@nanoforge/common";

import { EditableLibraryContext } from "../../context/contexts/library.editable-context";
import { Relationship } from "../relationship-functions";

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

  public setSound(library: ISoundLibrary): void {
    this._set(DefaultLibrariesEnum.SOUND, SOUND_LIBRARY, library, new EditableLibraryContext());
  }

  public setMusic(library: IMusicLibrary): void {
    this._set(DefaultLibrariesEnum.MUSIC, MUSIC_LIBRARY, library, new EditableLibraryContext());
  }

  public getLibraries(): LibraryHandle[] {
    return this._libraries;
  }

  public getInitLibraries(): LibraryHandle[] {
    return Relationship.getLibrariesByDependencies(this._libraries);
  }

  public getExecutionLibraries(): LibraryHandle<IRunnerLibrary>[] {
    return Relationship.getLibrariesByRun(this._getRunnerLibraries());
  }

  public getClearLibraries(): LibraryHandle[] {
    return Relationship.getLibrariesByDependencies(this._libraries, true);
  }

  public getMutableLibraries(): LibraryHandle<IMutableLibrary>[] {
    return this._libraries.filter(
      (handle) => handle && typeof handle.library["mute"] === "function",
    ) as LibraryHandle<IMutableLibrary>[];
  }

  private _getRunnerLibraries(): LibraryHandle<IRunnerLibrary>[] {
    return this._libraries.filter(
      (handle) => handle && typeof handle.library["run"] === "function",
    ) as LibraryHandle<IRunnerLibrary>[];
  }
}
