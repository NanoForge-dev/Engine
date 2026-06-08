import {
  type IGraphicsLibrary,
  type IInputLibrary,
  type ISoundLibrary,
} from "@nanoforge-dev/common";

import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Client-side NanoForge application.
 *
 * @remarks
 * Extends `NanoforgeApplication` with client-specific library slots for
 * graphics, input, and sound.  Create an instance via
 * `NanoforgeFactory.createClient`.
 *
 * @example
 * ```ts
 * const client = NanoforgeFactory.createClient();
 * client.useAssetManager(new AssetManagerLibrary());
 * client.useGraphics(new Graphics2DLibrary());
 * client.useInput(new InputLibrary());
 * client.useSound(new SoundLibrary());
 * await client.init(`container, files, env `);
 * client.run();
 * ```
 */
export class NanoforgeClient extends NanoforgeApplication {
  /**
   * Register the graphics library used to render the game.
   *
   * @param library - Graphics library instance (e.g. Graphics2DLibrary).
   */
  public useGraphics(library: IGraphicsLibrary) {
    this.applicationConfig.useGraphicsLibrary(library);
  }

  /**
   * Register the input library used to read keyboard and mouse state.
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
