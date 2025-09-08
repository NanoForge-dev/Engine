import { type IGraphicsLibrary, type IInputLibrary, type ISoundLibrary } from "@nanoforge/common";

import { NanoforgeApplication } from "./nanoforge-application";

export class NanoforgeClient extends NanoforgeApplication {
  public useGraphics(library: IGraphicsLibrary) {
    this.applicationConfig.useGraphicsLibrary(library);
  }

  public useInput(library: IInputLibrary) {
    this.applicationConfig.useInputLibrary(library);
  }

  public useSound(library: ISoundLibrary) {
    this.applicationConfig.useSoundLibrary(library);
  }
}
