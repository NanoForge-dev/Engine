import { type IGraphicsLibrary } from "@nanoforge/common";

import { NanoforgeApplication } from "./nanoforge-application";

export class NanoforgeClient extends NanoforgeApplication {
  public useGraphics(library: IGraphicsLibrary) {
    this.applicationConfig.useGraphicsLibrary(library);
  }
}
