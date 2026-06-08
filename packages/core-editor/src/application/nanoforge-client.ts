import {
  type IGraphicsLibrary,
  type IInputLibrary,
  type ISoundLibrary,
} from "@nanoforge-dev/common";

import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Client-side NanoForge application for editor mode.
 *
 * @remarks
 * Extends `NanoforgeApplication` with graphics, input, and sound library
 * slots.  Create via the `core-editor` `NanoforgeFactory`.
 */
export class NanoforgeClient extends NanoforgeApplication {
  /**
   * Register the graphics library.
   *
   * @param library - Graphics library instance (e.g. Graphics2DLibrary).
   */
  public useGraphics(library: IGraphicsLibrary) {
    this.applicationConfig.useGraphicsLibrary(library);
  }

  /**
   * Register the input library.
   *
   * @param library - Input library instance (e.g. InputLibrary).
   */
  public useInput(library: IInputLibrary) {
    this.applicationConfig.useInputLibrary(library);
  }

  /**
   * Register the sound-effect library.
   *
   * @param library - Sound library instance (e.g. SoundLibrary).
   */
  public useSound(library: ISoundLibrary) {
    this.applicationConfig.useSoundLibrary(library);
  }
}
