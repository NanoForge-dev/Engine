import {
  ASSET_MANAGER_LIBRARY,
  COMPONENT_SYSTEM_LIBRARY,
  GRAPHICS_LIBRARY,
  type IAssetManagerLibrary,
  type IComponentSystemLibrary,
  type IGraphicsLibrary,
  type INetworkLibrary,
  NETWORK_LIBRARY,
} from "../../libraries";
import { type LibraryHandle } from "../handle/library.handle";
import { BaseLibraryManager } from "./base-library.manager";

export enum DefaultLibrariesEnum {
  COMPONENT_SYSTEM,
  GRAPHICS,
  NETWORK,
  ASSET_MANAGER,
}

const DEFAULT_LIBRARIES: { index: DefaultLibrariesEnum; sym: symbol }[] = [
  { index: DefaultLibrariesEnum.COMPONENT_SYSTEM, sym: COMPONENT_SYSTEM_LIBRARY },
  { index: DefaultLibrariesEnum.GRAPHICS, sym: GRAPHICS_LIBRARY },
  { index: DefaultLibrariesEnum.NETWORK, sym: NETWORK_LIBRARY },
  { index: DefaultLibrariesEnum.ASSET_MANAGER, sym: ASSET_MANAGER_LIBRARY },
];

export class LibraryManager extends BaseLibraryManager {
  constructor() {
    super();

    for (const { index, sym } of DEFAULT_LIBRARIES) {
      this._setIndex(sym, index);
    }
  }

  public getComponentSystem<
    T extends IComponentSystemLibrary = IComponentSystemLibrary,
  >(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.COMPONENT_SYSTEM);
  }

  public getGraphics<T extends IGraphicsLibrary = IGraphicsLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.GRAPHICS);
  }

  public getNetwork<T extends INetworkLibrary = INetworkLibrary>(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.NETWORK);
  }

  public getAssetManager<
    T extends IAssetManagerLibrary = IAssetManagerLibrary,
  >(): LibraryHandle<T> {
    return this._get<T>(DefaultLibrariesEnum.ASSET_MANAGER);
  }
}
