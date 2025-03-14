import {
  COMPONENT_SYSTEM_LIBRARY,
  GRAPHICS_LIBRARY,
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
}

const DEFAULT_LIBRARIES: { index: DefaultLibrariesEnum; sym: symbol }[] = [
  { index: DefaultLibrariesEnum.COMPONENT_SYSTEM, sym: COMPONENT_SYSTEM_LIBRARY },
  { index: DefaultLibrariesEnum.GRAPHICS, sym: GRAPHICS_LIBRARY },
  { index: DefaultLibrariesEnum.NETWORK, sym: NETWORK_LIBRARY },
];

export class LibraryManager extends BaseLibraryManager {
  constructor() {
    super();

    for (const { index, sym } of DEFAULT_LIBRARIES) {
      this._setIndex(sym, index);
    }
  }

  public getComponentSystem(): LibraryHandle<IComponentSystemLibrary> {
    return this._get<IComponentSystemLibrary>(DefaultLibrariesEnum.COMPONENT_SYSTEM);
  }

  public getGraphics(): LibraryHandle<IGraphicsLibrary> {
    return this._get<IGraphicsLibrary>(DefaultLibrariesEnum.GRAPHICS);
  }

  public getNetwork(): LibraryHandle<INetworkLibrary> {
    return this._get<INetworkLibrary>(DefaultLibrariesEnum.NETWORK);
  }
}
