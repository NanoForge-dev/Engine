import {
  type IGraphicsLibrary,
  type IInputLibrary,
  type ISoundLibrary,
} from "@nanoforge-dev/common";

import { NanoforgeApplication } from "./nanoforge-application";

export class NanoforgeClient extends NanoforgeApplication {
  protected get type(): "client" {
    return "client";
  }

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
