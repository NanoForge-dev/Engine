import { type IExposedLibrary } from "../bases/exposed.library.type";

export interface ISoundLibrary extends IExposedLibrary {
  /**
   * mutes or unmutes the sound.
   */
  mute(): void;
}
